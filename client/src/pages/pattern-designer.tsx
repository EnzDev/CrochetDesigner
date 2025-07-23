import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, FolderOpen, Save } from "lucide-react";
import PatternCanvas from "@/components/canvas/PatternCanvas";
import ToolSidebar from "@/components/canvas/ToolSidebar";
import PatternInfoPanel from "@/components/canvas/PatternInfoPanel";
import { SavePatternModal } from "@/components/modals/SavePatternModal";
import { indexedDBStorage } from "@/lib/indexdb-storage";
import { drawCrochetSymbol } from "@/lib/crochet-symbols";

export interface CanvasState {
  tool: 'pen' | 'eraser' | 'fill' | 'select';
  symbol: string | null;
  color: string;
  gridSize: number;
  showGrid: boolean;
  zoom: number;
  canvasRows: number;
  canvasCols: number;
}

export interface PatternInfo {
  title: string;
  description?: string;
  hookSize: string;
  yarnWeight: string;
  gauge: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  notes: string;
  materials: string[];
}

export default function PatternDesigner() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentPatternId, setCurrentPatternId] = useState<number | null>(null);
  
  const [canvasState, setCanvasState] = useState<CanvasState>({
    tool: 'pen',
    symbol: null,
    color: '#000000',
    gridSize: 20,
    showGrid: true,
    zoom: 100,
    canvasRows: 3, // Start with 3 rows (1 working row + 2 empty rows above)
    canvasCols: 40, // Default number of columns
  });

  // Track which grid cells have symbols with their data
  const [gridSymbols, setGridSymbols] = useState<Map<string, { symbol: string; color: string }>>(new Map());

  const [patternInfo, setPatternInfo] = useState<PatternInfo>({
    title: '',
    description: '',
    hookSize: '5.0mm (H)',
    yarnWeight: 'Medium (4)',
    gauge: '',
    difficulty: 'intermediate',
    notes: '',
    materials: [],
  });

  // History for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Automatically redraw canvas when rows change or symbols are updated
  useEffect(() => {
    redrawCanvas();
  }, [canvasState.canvasRows, canvasState.canvasCols, canvasState.gridSize, gridSymbols]);

  // Symbol placement and removal handlers
  const handleSymbolPlaced = (row: number, col: number, symbol: string, color: string) => {
    // First check if we need to add a new row at the top
    if (row === 0) {
      // Add new row and shift existing symbols down
      setCanvasState(prev => ({
        ...prev,
        canvasRows: prev.canvasRows + 1
      }));
      
      // Update all existing symbol positions (shift down by 1 row) and add new symbol
      setGridSymbols(prev => {
        const newSymbols = new Map<string, { symbol: string; color: string }>();
        
        // Shift all existing symbols down by 1 row
        prev.forEach((value, oldKey) => {
          const [oldRow, oldCol] = oldKey.split('-').map(Number);
          const newKey = `${oldRow + 1}-${oldCol}`;
          newSymbols.set(newKey, value);
        });
        
        // Add the new symbol at the top row (0)
        newSymbols.set(`0-${col}`, { symbol, color });
        return newSymbols;
      });
    } else {
      // Normal placement - just add the symbol
      const key = `${row}-${col}`;
      setGridSymbols(prev => {
        const newSymbols = new Map(prev);
        newSymbols.set(key, { symbol, color });
        return newSymbols;
      });
    }
  };

  const handleSymbolErased = (row: number, col: number) => {
    const key = `${row}-${col}`;
    setGridSymbols(prev => {
      const newSymbols = new Map(prev);
      newSymbols.delete(key);
      return newSymbols;
    });

    // Check if top rows are now empty and can be removed
    setTimeout(() => {
      setCanvasState(prev => {
        let newRows = prev.canvasRows;
        
        // Remove empty top rows, but keep at least 3 rows
        while (newRows > 3) {
          const topRowHasSymbols = Array.from(gridSymbols.keys()).some(key => {
            const [row] = key.split('-').map(Number);
            return row === 0;
          });
          
          if (topRowHasSymbols) break;
          
          newRows--;
          // Shift all remaining symbols up by one row
          setGridSymbols(prevSymbols => {
            const newSymbols = new Map<string, { symbol: string; color: string }>();
            prevSymbols.forEach((value, oldKey) => {
              const [oldRow, oldCol] = oldKey.split('-').map(Number);
              if (oldRow > 0) { // Skip the top row being removed
                const newKey = `${oldRow - 1}-${oldCol}`;
                newSymbols.set(newKey, value);
              }
            });
            return newSymbols;
          });
        }
        
        return { ...prev, canvasRows: newRows };
      });
    }, 10); // Small delay to ensure state updates complete
  };

  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid if enabled
    if (canvasState.showGrid) {
      drawGrid(ctx, canvas.width, canvas.height, canvasState.gridSize);
    }
    
    // Draw symbols using proper crochet symbol drawing
    gridSymbols.forEach((symbolData, key) => {
      const [row, col] = key.split('-').map(Number);
      const x = col * canvasState.gridSize + canvasState.gridSize / 2;
      const y = row * canvasState.gridSize + canvasState.gridSize / 2;
      
      // Import the drawCrochetSymbol function inline for now
      drawCrochetSymbol(ctx, symbolData.symbol, x, y, symbolData.color, canvasState.gridSize * 0.8);
    });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const handleSaveCanvas = async () => {
    if (!canvasRef.current) return;
    
    // Save to IndexedDB
    try {
      const canvasData = canvasRef.current.toDataURL();
      const patternData = {
        title: patternInfo.title || 'Untitled Pattern',
        description: patternInfo.description || '',
        hookSize: patternInfo.hookSize,
        yarnWeight: patternInfo.yarnWeight,
        difficulty: patternInfo.difficulty,
        canvasData,
        gridSymbols: Object.fromEntries(gridSymbols),
        canvasRows: canvasState.canvasRows,
        canvasCols: canvasState.canvasCols,
        gridSize: canvasState.gridSize,
        canvasWidth: canvasRef.current.width,
        canvasHeight: canvasRef.current.height,
      };

      if (currentPatternId) {
        await indexedDBStorage.updatePattern(currentPatternId, patternData);
        toast({
          title: "Pattern updated",
          description: "Your pattern has been updated successfully.",
        });
      } else {
        const id = await indexedDBStorage.savePattern(patternData);
        setCurrentPatternId(id);
        toast({
          title: "Pattern saved",
          description: "Your pattern has been saved to your device.",
        });
      }
      setShowSaveModal(false);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save pattern. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadPattern = (pattern: any) => {
    setPatternInfo({
      title: pattern.title || '',
      description: pattern.description || '',
      hookSize: pattern.hookSize || '5.0mm (H)',
      yarnWeight: pattern.yarnWeight || 'Medium (4)',
      gauge: pattern.gauge || '',
      difficulty: pattern.difficulty || 'intermediate',
      notes: pattern.notes || '',
      materials: pattern.materials || [],
    });
    setCurrentPatternId(pattern.id);
    
    // Load canvas state
    if (pattern.canvasRows) {
      setCanvasState(prev => ({
        ...prev,
        canvasRows: pattern.canvasRows,
        canvasCols: pattern.canvasCols || prev.canvasCols,
        gridSize: pattern.gridSize || prev.gridSize,
      }));
    }
    
    // Load grid symbols
    if (pattern.gridSymbols) {
      const symbolMap = new Map();
      Object.entries(pattern.gridSymbols).forEach(([key, value]) => {
        symbolMap.set(key, value);
      });
      setGridSymbols(symbolMap);
    }
    
    // Load canvas image
    if (canvasRef.current && pattern.canvasData) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0);
          // Trigger redraw after loading
          setTimeout(() => {
            redrawCanvas();
          }, 100);
        };
        img.src = pattern.canvasData;
      }
    }
    
    toast({
      title: "Pattern loaded",
      description: `"${pattern.title}" has been loaded from your device.`,
    });
  };

  const handleExportImage = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${patternInfo.title || 'crochet-pattern'}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    toast({
      title: "Pattern exported",
      description: "Your pattern has been exported as an image.",
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = history[historyIndex - 1];
        }
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = history[historyIndex + 1];
        }
      }
    }
  };

  const handleClearCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setGridSymbols(new Map());
      setCanvasState(prev => ({ ...prev, canvasRows: 3 })); // Reset to 3 rows
      
      if (canvasState.showGrid) {
        drawGrid(ctx, canvas.width, canvas.height, canvasState.gridSize);
      }
      saveToHistory();
    }
  };

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    
    const canvasData = canvasRef.current.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvasData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  return (
    <div className="h-screen flex flex-col bg-craft-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-craft-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-craft-800">Crochet Pattern Designer</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={() => setShowSaveModal(true)}
              className="text-craft-600 hover:text-craft-800"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button
              onClick={handleSaveCanvas}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleExportImage}
              className="bg-accent hover:bg-accent/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0 md:flex-row flex-col">
        <ToolSidebar
          canvasState={canvasState}
          setCanvasState={setCanvasState}
          onClearCanvas={handleClearCanvas}
        />
        
        <PatternCanvas
          ref={canvasRef}
          canvasState={canvasState}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearCanvas={handleClearCanvas}
          onSaveToHistory={saveToHistory}
          onSymbolPlaced={handleSymbolPlaced}
          onSymbolErased={handleSymbolErased}
          onRedrawNeeded={redrawCanvas}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
        
        <SavePatternModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          patternInfo={patternInfo}
          setPatternInfo={setPatternInfo}
          onSave={handleSaveCanvas}
          onLoad={handleLoadPattern}
          isLoading={false}
        />
      </div>
    </div>
  );
}