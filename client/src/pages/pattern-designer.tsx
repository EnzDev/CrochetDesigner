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
import { simplePattern, type SimplePattern, type SimpleSymbol } from "@/lib/simple-pattern";

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

export interface SelectionArea {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
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

// Helper function to check if a point is near a selection handle
const isNearHandle = (mouseX: number, mouseY: number, handleX: number, handleY: number, threshold: number = 10) => {
  return Math.abs(mouseX - handleX) <= threshold && Math.abs(mouseY - handleY) <= threshold;
};

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
  const [selection, setSelection] = useState<SelectionArea | null>(null);
  const [copiedSymbols, setCopiedSymbols] = useState<SimpleSymbol[]>([]);

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
  }, [canvasState, patternState, selection]);

  // Watch for color changes when there's an active selection
  useEffect(() => {
    if (selection && canvasState.tool === 'select') {
      // Change color of selected symbols when color picker changes
      simplePattern.changeSelectionColor(
        Math.min(selection.startRow, selection.endRow),
        Math.min(selection.startCol, selection.endCol),
        Math.max(selection.startRow, selection.endRow),
        Math.max(selection.startCol, selection.endCol),
        canvasState.color
      );
      setPatternState(simplePattern.getPattern());
    }
  }, [canvasState.color]); // Only depend on color change, not selection to avoid loops

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelection();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        // Paste at top-left of current selection or at (0,0)
        const targetRow = selection ? Math.min(selection.startRow, selection.endRow) : 0;
        const targetCol = selection ? Math.min(selection.startCol, selection.endCol) : 0;
        pasteSelection(targetRow, targetCol);
      } else if (e.key === 'Escape') {
        setSelection(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selection, copiedSymbols]);

  // Selection handlers
  const handleSelectionStart = (row: number, col: number) => {
    setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
  };

  const handleSelectionUpdate = (row: number, col: number) => {
    if (selection) {
      setSelection({ ...selection, endRow: row, endCol: col });
    }
  };

  const handleSelectionEnd = () => {
    // Selection is complete, ready for copy/paste operations
  };

  const copySelection = () => {
    if (!selection) return;
    
    const minRow = Math.min(selection.startRow, selection.endRow);
    const maxRow = Math.max(selection.startRow, selection.endRow);
    const minCol = Math.min(selection.startCol, selection.endCol);
    const maxCol = Math.max(selection.startCol, selection.endCol);
    
    const selectedSymbols = patternState.symbols.filter(symbol => 
      symbol.symbol !== 'occupied' &&
      symbol.row >= minRow && symbol.row <= maxRow &&
      symbol.col >= minCol && symbol.col <= maxCol
    ).map(symbol => ({
      ...symbol,
      row: symbol.row - minRow, // Normalize to relative position
      col: symbol.col - minCol
    }));
    
    setCopiedSymbols(selectedSymbols);
    toast({
      title: "Copied",
      description: `Copied ${selectedSymbols.length} symbols`,
    });
  };

  const pasteSelection = (targetRow: number, targetCol: number) => {
    if (copiedSymbols.length === 0) return;
    
    copiedSymbols.forEach(symbol => {
      simplePattern.placeSymbol(
        targetRow + symbol.row,
        targetCol + symbol.col,
        symbol.symbol,
        symbol.color
      );
    });
    
    setPatternState(simplePattern.getPattern());
    toast({
      title: "Pasted",
      description: `Pasted ${copiedSymbols.length} symbols`,
    });
  };

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

    // Draw selection rectangle if selecting
    if (selection) {
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      const startX = selection.startCol * canvasState.gridSize;
      const startY = selection.startRow * canvasState.gridSize;
      const endX = (selection.endCol + 1) * canvasState.gridSize;
      const endY = (selection.endRow + 1) * canvasState.gridSize;
      
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      ctx.setLineDash([]);
      
      // Draw corner resize handles
      const handleSize = 8;
      ctx.fillStyle = '#007bff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      // Top-left handle
      ctx.fillRect(startX - handleSize/2, startY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(startX - handleSize/2, startY - handleSize/2, handleSize, handleSize);
      
      // Top-right handle
      ctx.fillRect(endX - handleSize/2, startY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(endX - handleSize/2, startY - handleSize/2, handleSize, handleSize);
      
      // Bottom-left handle
      ctx.fillRect(startX - handleSize/2, endY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(startX - handleSize/2, endY - handleSize/2, handleSize, handleSize);
      
      // Bottom-right handle
      ctx.fillRect(endX - handleSize/2, endY - handleSize/2, handleSize, handleSize);
      ctx.strokeRect(endX - handleSize/2, endY - handleSize/2, handleSize, handleSize);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
    // Basic grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      const physicalCol = x / gridSize;
      const actualCol = physicalCol + patternState.startCol; // Apply startCol offset
      
      // Special styling for starting column (column 0)
      let isStartingColumn = false;
      if (actualCol === 0) {
        ctx.strokeStyle = '#8b5cf6'; // Purple for starting column
        ctx.lineWidth = 3;
        isStartingColumn = true;
      } else if (canvasState.gridStyle === 'every50' && actualCol % 50 === 0) {
        ctx.strokeStyle = '#ff6b6b'; // Red for every 50
        ctx.lineWidth = 2;
      } else if (canvasState.gridStyle !== 'basic' && actualCol % 10 === 0) {
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
      
      // Add label for starting column
      if (isStartingColumn) {
        ctx.font = `${Math.max(12, gridSize * 0.5)}px Arial`;
        ctx.fillStyle = '#8b5cf6';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('START', x + 2, 2);
      }
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
        const physicalCol = x / gridSize;
        const actualCol = physicalCol + patternState.startCol; // Apply startCol offset
        
        if (physicalCol > 0 && (actualCol % 10 === 0 || (canvasState.gridStyle === 'every50' && actualCol % 50 === 0))) {
          // Set text color based on line type
          if (canvasState.gridStyle === 'every50' && actualCol % 50 === 0) {
            ctx.fillStyle = '#dc2626'; // Darker red for 50s
          } else {
            ctx.fillStyle = '#0f766e'; // Darker teal for 10s
          }
          
          // Draw number below the first row
          ctx.fillText(
            actualCol.toString(),
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
          patternState.symbols.map(s => [`${s.row}-${s.col}`, { symbol: s.symbol, color: s.color, width: s.width || 1 }])
        ),
        canvasRows: patternState.rows,
        canvasCols: patternState.cols,
        gridSize: patternState.gridSize,
        startCol: patternState.startCol,
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
          color: s.color,
          width: s.width || 1
        }));
      } else {
        symbols = Object.entries(pattern.gridSymbols).map(([key, value]: [string, any]) => {
          const [row, col] = key.split('-').map(Number);
          return {
            row,
            col,
            symbol: value.symbol || value.symbolType,
            color: value.color,
            width: value.width || 1
          };
        });
      }
      
      // Clear existing pattern first
      simplePattern.clearPattern();
      
      console.log('Loading symbols:', symbols);
      
      simplePattern.loadPattern({
        symbols,
        rows: pattern.canvasRows || 3,
        cols: pattern.canvasCols || 40,
        gridSize: pattern.gridSize || 20,
        startCol: pattern.startCol || 0
      });
      
      setPatternState(simplePattern.getPattern());
      
      console.log('Pattern loaded, current state:', simplePattern.getPattern());
    }
    
    // Force redraw after loading
    setTimeout(() => {
      redrawCanvas();
    }, 100);
    
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
          onCopySelection={copySelection}
          onPasteSelection={() => {
            const targetRow = selection ? Math.min(selection.startRow, selection.endRow) : 0;
            const targetCol = selection ? Math.min(selection.startCol, selection.endCol) : 0;
            pasteSelection(targetRow, targetCol);
          }}
          hasSelection={!!selection}
          hasCopiedSymbols={copiedSymbols.length > 0}
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
          onSelectionStart={handleSelectionStart}
          onSelectionUpdate={handleSelectionUpdate}
          onSelectionEnd={handleSelectionEnd}
          selection={selection}
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