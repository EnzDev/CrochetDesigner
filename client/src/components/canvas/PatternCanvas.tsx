import { forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { drawCrochetSymbol } from "@/lib/crochet-symbols";
import type { CanvasState } from "@/pages/pattern-designer";
import { cn } from "@/lib/utils";

interface PatternCanvasProps {
  canvasState: CanvasState;
  onUndo: () => void;
  onRedo: () => void;
  onClearCanvas: () => void;
  onSaveToHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const PatternCanvas = forwardRef<HTMLCanvasElement, PatternCanvasProps>(
  ({ canvasState, onUndo, onRedo, onClearCanvas, onSaveToHistory, canUndo, canRedo }, ref) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [hoverGridPos, setHoverGridPos] = useState<{ x: number; y: number } | null>(null);
    const [fillStartPos, setFillStartPos] = useState<{ x: number; y: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Separate effect for grid drawing only
    useEffect(() => {
      const canvas = ref as React.RefObject<HTMLCanvasElement>;
      if (!canvas.current) return;

      const ctx = canvas.current.getContext('2d');
      if (!ctx) return;

      // Only redraw grid when grid settings change
      if (canvasState.showGrid) {
        drawGrid(ctx, canvas.current.width, canvas.current.height, canvasState.gridSize);
      }
    }, [canvasState.showGrid, canvasState.gridSize, ref]);



    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, gridSize: number) => {
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
      ctx.lineWidth = 1;
      
      // Draw vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0); // Add 0.5 for crisp lines
        ctx.lineTo(x + 0.5, height);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5); // Add 0.5 for crisp lines
        ctx.lineTo(width, y + 0.5);
        ctx.stroke();
      }
    };

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = ref as React.RefObject<HTMLCanvasElement>;
      if (!canvas.current) return { x: 0, y: 0 };

      const rect = canvas.current.getBoundingClientRect();
      const scaleX = canvas.current.width / rect.width;
      const scaleY = canvas.current.height / rect.height;

      let clientX: number, clientY: number;
      
      if ('touches' in e) {
        // Touch event
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = ref as React.RefObject<HTMLCanvasElement>;
      if (!canvas.current) return;

      const ctx = canvas.current.getContext('2d');
      if (!ctx) return;

      const pos = getCanvasCoordinates(e);
      setIsDrawing(true);
      setLastPos(pos);

      if (canvasState.tool === 'fill' && canvasState.symbol) {
        // Fill tool - two-click operation
        const gridCol = Math.floor(pos.x / canvasState.gridSize);
        const gridRow = Math.floor(pos.y / canvasState.gridSize);
        const gridX = gridCol * canvasState.gridSize;
        const gridY = gridRow * canvasState.gridSize;
        
        if (!fillStartPos) {
          // First click - set start position
          setFillStartPos({ x: gridX, y: gridY });
        } else {
          // Second click - fill rectangle and reset
          fillRectangle(ctx, fillStartPos, { x: gridX, y: gridY });
          setFillStartPos(null);
          onSaveToHistory();
        }
      } else if (canvasState.tool === 'pen' && canvasState.symbol) {
        // Snap to grid center - better alignment
        const gridX = Math.floor(pos.x / canvasState.gridSize) * canvasState.gridSize + canvasState.gridSize / 2;
        const gridY = Math.floor(pos.y / canvasState.gridSize) * canvasState.gridSize + canvasState.gridSize / 2;
        
        drawCrochetSymbol(ctx, canvasState.symbol, gridX, gridY, canvasState.color, canvasState.gridSize);
        onSaveToHistory();
      } else if (canvasState.tool === 'pen') {
        // Start freehand drawing
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.strokeStyle = canvasState.color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      } else if (canvasState.tool === 'eraser') {
        // Start erasing
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
    };

    const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = ref as React.RefObject<HTMLCanvasElement>;
      if (!canvas.current) return;

      const ctx = canvas.current.getContext('2d');
      if (!ctx) return;

      const pos = getCanvasCoordinates(e);

      if (canvasState.tool === 'pen' && !canvasState.symbol) {
        // Continuous freehand drawing
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      } else if (canvasState.tool === 'pen' && canvasState.symbol) {
        // Continuous symbol placement on grid
        const gridX = Math.floor(pos.x / canvasState.gridSize) * canvasState.gridSize + canvasState.gridSize / 2;
        const gridY = Math.floor(pos.y / canvasState.gridSize) * canvasState.gridSize + canvasState.gridSize / 2;
        
        // Only place if we moved to a different grid cell
        const currentGridKey = `${Math.floor(gridX / canvasState.gridSize)}-${Math.floor(gridY / canvasState.gridSize)}`;
        const lastGridKey = `${Math.floor(lastPos.x / canvasState.gridSize)}-${Math.floor(lastPos.y / canvasState.gridSize)}`;
        
        if (currentGridKey !== lastGridKey) {
          drawCrochetSymbol(ctx, canvasState.symbol, gridX, gridY, canvasState.color, canvasState.gridSize);
        }
      } else if (canvasState.tool === 'eraser') {
        // Continuous erasing
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }

      setLastPos(pos);
    };

    const fillRectangle = (ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) => {
      if (!canvasState.symbol) return;
      
      const startCol = Math.floor(start.x / canvasState.gridSize);
      const startRow = Math.floor(start.y / canvasState.gridSize);
      const endCol = Math.floor(end.x / canvasState.gridSize);
      const endRow = Math.floor(end.y / canvasState.gridSize);
      
      const minCol = Math.min(startCol, endCol);
      const maxCol = Math.max(startCol, endCol);
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      
      for (let col = minCol; col <= maxCol; col++) {
        for (let row = minRow; row <= maxRow; row++) {
          const symbolX = col * canvasState.gridSize + canvasState.gridSize / 2;
          const symbolY = row * canvasState.gridSize + canvasState.gridSize / 2;
          drawCrochetSymbol(ctx, canvasState.symbol, symbolX, symbolY, canvasState.color, canvasState.gridSize);
        }
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasCoordinates(e);
      
      // Hover feedback for different tools
      if ((canvasState.tool === 'pen' || canvasState.tool === 'fill') && canvasState.symbol && !isDrawing) {
        const gridCol = Math.floor(pos.x / canvasState.gridSize);
        const gridRow = Math.floor(pos.y / canvasState.gridSize);
        const gridX = gridCol * canvasState.gridSize;
        const gridY = gridRow * canvasState.gridSize;
        
        const newHoverPos = { x: gridX, y: gridY };
        
        // Only update if position changed
        if (!hoverGridPos || hoverGridPos.x !== newHoverPos.x || hoverGridPos.y !== newHoverPos.y) {
          setHoverGridPos(newHoverPos);
        }
      } else if (hoverGridPos) {
        setHoverGridPos(null);
      }
      
      // Call the drawing handler for actual drawing
      handleDrawing(e);
    };

    const handleStopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (e) e.preventDefault();
      if (isDrawing && (canvasState.tool === 'pen' || canvasState.tool === 'eraser')) {
        onSaveToHistory();
      }
      setIsDrawing(false);
    };

    const handleZoomIn = () => {
      // Implement zoom functionality
    };

    const handleZoomOut = () => {
      // Implement zoom functionality
    };

    return (
      <div className="flex-1 flex flex-col bg-craft-50">
        {/* Canvas Toolbar */}
        <div className="bg-white border-b border-craft-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="text-craft-600 hover:text-craft-800"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="text-craft-600 hover:text-craft-800"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-craft-200"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCanvas}
                className="text-craft-600 hover:text-craft-800"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Canvas
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-craft-600">
              <span>Zoom: {canvasState.zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                className="text-craft-600 hover:text-craft-800"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                className="text-craft-600 hover:text-craft-800"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-auto" ref={containerRef}>
          <div className="bg-white rounded-lg shadow-sm border border-craft-200 p-6">
            <div className="relative">
              <canvas
                ref={ref}
                className={cn(
                  "border border-craft-300 rounded-lg",
                  canvasState.tool === 'pen' && canvasState.symbol 
                    ? "cursor-pointer" 
                    : canvasState.tool === 'fill' && canvasState.symbol
                    ? "cursor-cell"
                    : canvasState.tool === 'eraser'
                    ? "cursor-grab"
                    : "cursor-crosshair"
                )}
                width={800}
                height={600}
                onMouseDown={handleStartDrawing}
                onMouseMove={handleMouseMove}
                onMouseUp={handleStopDrawing}
                onMouseLeave={handleStopDrawing}
                onTouchStart={handleStartDrawing}
                onTouchMove={handleDrawing}
                onTouchEnd={handleStopDrawing}
                onTouchCancel={handleStopDrawing}
              />
              
              {/* Canvas overlay for info */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm">
                <div className="flex items-center space-x-2 text-xs text-craft-600">
                  <span>Canvas: 800×600</span>
                  <div className="w-px h-4 bg-craft-200"></div>
                  <span className="capitalize">{canvasState.tool} Tool</span>
                  {canvasState.symbol && (
                    <>
                      <div className="w-px h-4 bg-craft-200"></div>
                      <span className="uppercase">{canvasState.symbol}</span>
                    </>
                  )}
                  {canvasState.tool === 'fill' && fillStartPos && (
                    <>
                      <div className="w-px h-4 bg-craft-200"></div>
                      <span className="text-blue-600">Click second corner</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Visual indicator for fill start position */}
              {fillStartPos && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-200/30 pointer-events-none"
                  style={{
                    left: fillStartPos.x,
                    top: fillStartPos.y,
                    width: canvasState.gridSize,
                    height: canvasState.gridSize,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PatternCanvas.displayName = "PatternCanvas";

export default PatternCanvas;