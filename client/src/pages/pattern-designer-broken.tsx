import { useState, useRef, useEffect } from "react";
// Removed react-query imports for offline-only app
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, FolderOpen, Save } from "lucide-react";
import PatternCanvas from "@/components/canvas/PatternCanvas";
import ToolSidebar from "@/components/canvas/ToolSidebar";
import PatternInfoPanel from "@/components/canvas/PatternInfoPanel";
import { SavePatternModal } from "@/components/modals/SavePatternModal";
// Remove shared schema import - using local types now

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

  // Automatically redraw canvas when rows change or symbols are updated
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      redrawCanvas();
    }, 10); // Small delay to ensure state is fully updated
    
    return () => clearTimeout(timeoutId);
  }, [canvasState.canvasRows, gridSymbols, canvasState.showGrid]);

  // Handle symbol placement with upward row expansion (proper crochet growth)
  const handleSymbolPlaced = (row: number, col: number, symbol: string, color: string) => {
    // If placing on the top 2 rows, we need to add rows above and shift everything down
    if (row <= 1) {
      const rowsToAdd = row === 0 ? 2 : 1;
      
      // First, update row count
      setCanvasState(prev => ({
        ...prev,
        canvasRows: prev.canvasRows + rowsToAdd
      }));
      
      // Then shift all existing symbols down and add the new one
      setGridSymbols(prev => {
        const newMap = new Map();
        
        // Shift all existing symbols down by the number of rows added
        prev.forEach((symbolData, key) => {
          const [oldRow, oldCol] = key.split('-').map(Number);
          const newKey = `${oldRow + rowsToAdd}-${oldCol}`;
          newMap.set(newKey, symbolData);
        });
        
        // Add the new symbol at its shifted position
        const newSymbolKey = `${row + rowsToAdd}-${col}`;
        newMap.set(newSymbolKey, { symbol, color });
        
        return newMap;
      });
    } else {
      // Normal placement on existing rows
      const cellKey = `${row}-${col}`;
      setGridSymbols(prev => {
        const newMap = new Map(prev);
        newMap.set(cellKey, { symbol, color });
        return newMap;
      });
    }
  };

  // Handle symbol erasing (simplified - no automatic row removal for now)
  const handleSymbolErased = (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    setGridSymbols(prev => {
      const newMap = new Map(prev);
      newMap.delete(cellKey);
      return newMap;
    });
  };

  // Redraw canvas with all symbols (accounts for dynamic canvas resizing)
  const redrawCanvas = async () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Update canvas size based on current row count
    const newHeight = canvasState.canvasRows * canvasState.gridSize;
    if (canvasRef.current.height !== newHeight) {
      canvasRef.current.height = newHeight;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Redraw grid if enabled
    if (canvasState.showGrid) {
      drawGrid(ctx, canvasRef.current.width, canvasRef.current.height, canvasState.gridSize);
    }
    
    // Import the symbol drawing function once
    const { drawCrochetSymbol } = await import('@/lib/crochet-symbols');
    
    // Redraw all symbols
    gridSymbols.forEach(({ symbol, color }, cellKey) => {
      const [row, col] = cellKey.split('-').map(Number);
      // Ensure symbol is within current canvas bounds
      if (row < canvasState.canvasRows && col < canvasState.canvasCols) {
        const x = col * canvasState.gridSize + canvasState.gridSize / 2;
        const y = row * canvasState.gridSize + canvasState.gridSize / 2;
        
        drawCrochetSymbol(ctx, symbol, x, y, color, canvasState.gridSize);
      }
    });
  };

  // Helper function for drawing grid (moved from canvas component)
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
  };

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

  const { data: patterns } = useQuery({
    queryKey: ['/api/patterns'],
  });

  const savePatternMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/patterns', data);
    },
    onSuccess: (pattern: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      setCurrentPatternId(pattern.id);
      toast({
        title: "Pattern saved offline",
        description: `"${pattern.title}" has been saved to your device.`,
      });
      setShowSaveModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save pattern. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePatternMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest('PUT', `/api/patterns/${id}`, data);
    },
    onSuccess: (pattern: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      toast({
        title: "Pattern updated offline",
        description: `"${pattern.title}" has been updated on your device.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pattern. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasData = canvas.toDataURL();
    
    const patternData = {
      canvasState,
      history: history.slice(0, historyIndex + 1),
    };

    // Convert gridSymbols Map to plain object for storage
    const gridSymbolsObj: Record<string, { symbol: string; color: string }> = {};
    gridSymbols.forEach((value, key) => {
      gridSymbolsObj[key] = value;
    });

    const data = {
      ...patternInfo,
      canvasData,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      gridSize: canvasState.gridSize,
      canvasRows: canvasState.canvasRows,
      canvasCols: canvasState.canvasCols,
      gridSymbols: gridSymbolsObj,
      patternElements: patternData,
    };

    if (currentPatternId) {
      updatePatternMutation.mutate({ id: currentPatternId, data });
    } else {
      savePatternMutation.mutate(data);
    }
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

  const handleLoadPattern = (pattern: any) => {
    setPatternInfo({
      title: pattern.title || '',
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
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setGridSymbols(new Map()); // Clear symbol tracking
        // Reset to 3 rows when cleared (1 working + 2 empty)
        setCanvasState(prev => ({
          ...prev,
          canvasRows: 3
        }));
        // Redraw grid if enabled
        if (canvasState.showGrid) {
          drawGrid(ctx, canvas.width, canvas.height, canvasState.gridSize);
        }
        saveToHistory();
      }
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
              disabled={false}
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
