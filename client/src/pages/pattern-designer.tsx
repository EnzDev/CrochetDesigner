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
import { simplePattern, type SimplePattern } from "@/lib/simple-pattern";

export interface CanvasState {
  tool: 'pen' | 'eraser' | 'fill' | 'select';
  symbol: string | null;
  color: string;
  gridSize: number;
  showGrid: boolean;
  gridStyle: 'basic' | 'every10' | 'every50';
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
    symbol: 'chain', // Default to chain symbol
    color: '#000000',
    gridSize: 20,
    showGrid: true,
    gridStyle: 'basic',
    zoom: 100,
    canvasRows: 3, // Start with 3 rows (1 working row + 2 empty rows above)
    canvasCols: 40, // Default number of columns
  });

  // Use simple pattern state
  const [patternState, setPatternState] = useState<SimplePattern>(simplePattern.getPattern());

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

  // Update canvas state when pattern changes
  useEffect(() => {
    setCanvasState(prev => ({
      ...prev,
      canvasRows: patternState.rows,
      canvasCols: patternState.cols,
      gridSize: patternState.gridSize
    }));
  }, [patternState]);

  // Redraw canvas when canvas state or pattern state changes
  useEffect(() => {
    redrawCanvas();
  }, [canvasState, patternState]);

  // Symbol placement and removal handlers
  const handleSymbolPlaced = (row: number, col: number, symbol: string, color: string) => {
    simplePattern.placeSymbol(row, col, symbol, color);
    setPatternState(simplePattern.getPattern());
  };

  const handleSymbolErased = (row: number, col: number) => {
    simplePattern.removeSymbol(row, col);
    setPatternState(simplePattern.getPattern());
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
    
    // Draw symbols from pattern state
    patternState.symbols.forEach((symbol) => {
      // Skip occupied markers - only draw actual symbols
      if (symbol.symbol === 'occupied') return;
      
      // For multi-cell symbols, center them across their width
      const symbolWidth = symbol.width || 1;
      const centerOffset = (symbolWidth - 1) * canvasState.gridSize / 2;
      const x = symbol.col * canvasState.gridSize + canvasState.gridSize / 2 + centerOffset;
      const y = symbol.row * canvasState.gridSize + canvasState.gridSize / 2;
      
      drawCrochetSymbol(ctx, symbol.symbol, x, y, symbol.color, canvasState.gridSize * 0.8);
    });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
    // Basic grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      const colIndex = x / gridSize;
      
      // Set line style based on grid preferences
      if (canvasState.gridStyle === 'every50' && colIndex % 50 === 0) {
        ctx.strokeStyle = '#ff6b6b'; // Red for every 50
        ctx.lineWidth = 2;
      } else if (canvasState.gridStyle !== 'basic' && colIndex % 10 === 0) {
        ctx.strokeStyle = '#4ecdc4'; // Teal for every 10
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#e0e0e0'; // Light gray for regular
        ctx.lineWidth = 1;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      const rowIndex = y / gridSize;
      
      // Set line style based on grid preferences
      if (canvasState.gridStyle === 'every50' && rowIndex % 50 === 0) {
        ctx.strokeStyle = '#ff6b6b'; // Red for every 50
        ctx.lineWidth = 2;
      } else if (canvasState.gridStyle !== 'basic' && rowIndex % 10 === 0) {
        ctx.strokeStyle = '#4ecdc4'; // Teal for every 10
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#e0e0e0'; // Light gray for regular
        ctx.lineWidth = 1;
      }
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw grid numbers when enhanced grid is enabled
    if (canvasState.gridStyle !== 'basic') {
      ctx.font = `${Math.max(10, gridSize * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Column numbers (below first row)
      for (let x = 0; x <= width; x += gridSize) {
        const colIndex = x / gridSize;
        
        if (colIndex > 0 && (colIndex % 10 === 0 || (canvasState.gridStyle === 'every50' && colIndex % 50 === 0))) {
          // Set text color based on line type
          if (canvasState.gridStyle === 'every50' && colIndex % 50 === 0) {
            ctx.fillStyle = '#dc2626'; // Darker red for 50s
          } else {
            ctx.fillStyle = '#0f766e'; // Darker teal for 10s
          }
          
          // Draw number below the first row
          ctx.fillText(
            colIndex.toString(),
            x,
            gridSize + 2
          );
        }
      }
      
      // Row numbers (to the left of first column)
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      for (let y = 0; y <= height; y += gridSize) {
        const rowIndex = y / gridSize;
        
        if (rowIndex > 0 && (rowIndex % 10 === 0 || (canvasState.gridStyle === 'every50' && rowIndex % 50 === 0))) {
          // Set text color based on line type
          if (canvasState.gridStyle === 'every50' && rowIndex % 50 === 0) {
            ctx.fillStyle = '#dc2626'; // Darker red for 50s
          } else {
            ctx.fillStyle = '#0f766e'; // Darker teal for 10s
          }
          
          // Draw number to the left of first column
          ctx.fillText(
            rowIndex.toString(),
            -2,
            y + gridSize / 2
          );
        }
      }
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
        gridSymbols: Object.fromEntries(
          patternState.symbols.map(s => [`${s.row}-${s.col}`, { symbol: s.symbol, color: s.color }])
        ),
        canvasRows: patternState.rows,
        canvasCols: patternState.cols,
        gridSize: patternState.gridSize,
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
      let symbols = [];
      
      if (Array.isArray(pattern.gridSymbols)) {
        symbols = pattern.gridSymbols.map((s: any) => ({
          row: s.row,
          col: s.col,
          symbol: s.symbol || s.symbolType,
          color: s.color
        }));
      } else {
        symbols = Object.entries(pattern.gridSymbols).map(([key, value]: [string, any]) => {
          const [row, col] = key.split('-').map(Number);
          return {
            row,
            col,
            symbol: value.symbol || value.symbolType,
            color: value.color
          };
        });
      }
      
      simplePattern.loadPattern({
        symbols,
        rows: pattern.canvasRows || 3,
        cols: pattern.canvasCols || 40,
        gridSize: pattern.gridSize || 20
      });
      
      setPatternState(simplePattern.getPattern());
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
    if (simplePattern.undo()) {
      setPatternState(simplePattern.getPattern());
    }
  };

  const handleRedo = () => {
    if (simplePattern.redo()) {
      setPatternState(simplePattern.getPattern());
    }
  };

  const handleClearCanvas = () => {
    simplePattern.clear();
    simplePattern.saveToHistory();
    setPatternState(simplePattern.getPattern());
  };

  const saveToHistory = () => {
    simplePattern.saveToHistory();
  };

  const handleFillRectangle = (startRow: number, startCol: number, endRow: number, endCol: number, symbol: string, color: string) => {
    simplePattern.fillRectangle(startRow, startCol, endRow, endCol, symbol, color);
    simplePattern.saveToHistory();
    setPatternState(simplePattern.getPattern());
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

      <div className="flex flex-1 overflow-hidden min-h-0 flex-col md:flex-row">
        <ToolSidebar
          canvasState={canvasState}
          setCanvasState={setCanvasState}
          onClearCanvas={handleClearCanvas}
          onPatternChange={() => setPatternState(simplePattern.getPattern())}
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
          onFillRectangle={handleFillRectangle}
          canUndo={simplePattern.canUndo()}
          canRedo={simplePattern.canRedo()}
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