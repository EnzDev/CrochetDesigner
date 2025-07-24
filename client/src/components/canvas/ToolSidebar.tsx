import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, Eraser, PaintBucket, MousePointer, Grid3x3, Trash2, Plus, Minus, Copy, Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasState } from "@/pages/pattern-designer";
import { simplePattern } from "@/lib/simple-pattern";
import { useEffect, useState } from "react";

interface ToolSidebarProps {
  canvasState: CanvasState;
  setCanvasState: (state: CanvasState | ((prev: CanvasState) => CanvasState)) => void;
  onClearCanvas: () => void;
  onPatternChange: () => void;
  onCopySelection?: () => void;
  onPasteSelection?: () => void;
  onClearSelection?: () => void;
  hasSelection?: boolean;
  hasCopiedSymbols?: boolean;
}

export default function ToolSidebar({ canvasState, setCanvasState, onClearCanvas, onPatternChange, onCopySelection, onPasteSelection, onClearSelection, hasSelection, hasCopiedSymbols }: ToolSidebarProps) {
  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'select', icon: MousePointer, label: 'Select' },
  ] as const;

  const symbols = [
    { id: 'chain', label: 'Chain' },
    { id: 'sc', label: 'SC' },
    { id: 'dc', label: 'DC' },
    { id: 'tr', label: 'TR' },
    { id: 'sl', label: 'SL ST' },
    { id: 'yo', label: 'YO' },
    { id: '2dctog', label: '2DC Tog' },
    { id: '3dctog', label: '3DC Tog' },
  ];

  const [symbolPreviews, setSymbolPreviews] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Generate canvas-based previews for each symbol
    const previews: {[key: string]: string} = {};
    
    symbols.forEach(symbol => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Import and use the actual drawing function
        import('@/lib/crochet-symbols').then(({ drawCrochetSymbol }) => {
          // Use smaller size for multi-cell symbols to fit in button
          const symbolSize = (symbol.id === '2dctog' || symbol.id === '3dctog') ? 10 : 16;
          const isMirrored = (symbol.id === '2dctog' || symbol.id === '3dctog') && 
                            canvasState.symbol === symbol.id && 
                            canvasState.symbolMirrored;
          drawCrochetSymbol(ctx, symbol.id, 16, 16, '#374151', symbolSize, isMirrored);
          previews[symbol.id] = canvas.toDataURL();
          setSymbolPreviews(prev => ({ ...prev, [symbol.id]: canvas.toDataURL() }));
        });
      }
    });
  }, [canvasState.symbol, canvasState.symbolMirrored]);

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
  ];

  return (
    <div className="w-full md:w-72 min-w-0 flex-shrink-0 bg-white border-r border-craft-200 p-4 overflow-y-auto md:max-h-full max-h-64">
      {/* Drawing Tools */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-craft-700 mb-3">Drawing Tools</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 md:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                variant="outline"
                className={cn(
                  "p-3 h-auto flex-col gap-1 text-center transition-colors touch-manipulation active:scale-95",
                  canvasState.tool === tool.id
                    ? "bg-accent text-white border-accent"
                    : "border-craft-200 hover:border-accent"
                )}
                onClick={() => {
                  // Clear selection when switching away from select tool
                  if (canvasState.tool === 'select' && tool.id !== 'select' && onClearSelection) {
                    onClearSelection();
                  }
                  setCanvasState(prev => ({ 
                    ...prev, 
                    tool: tool.id as any,
                    // Clear symbol selection when switching away from pen and fill tools
                    ...(tool.id !== 'pen' && tool.id !== 'fill' ? { symbol: null } : {})
                  }));
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{tool.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Crochet Symbols */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-craft-700 mb-3">Crochet Symbols</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {symbols.map((symbol) => (
            <Button
              key={symbol.id}
              variant="outline"
              className={cn(
                "p-3 h-auto flex-col gap-1 text-center transition-all hover:scale-105 touch-manipulation active:scale-95",
                canvasState.symbol === symbol.id
                  ? "bg-accent/10 border-accent"
                  : "border-craft-200 hover:border-accent hover:bg-accent/5"
              )}
              onClick={() => {
                // For decrease stitches, toggle mirroring if same symbol is clicked again
                if ((symbol.id === '2dctog' || symbol.id === '3dctog') && canvasState.symbol === symbol.id) {
                  setCanvasState(prev => ({ 
                    ...prev,
                    symbolMirrored: !prev.symbolMirrored
                  }));
                } else {
                  setCanvasState(prev => ({ 
                    ...prev, 
                    symbol: symbol.id,
                    // Only switch to pen if coming from eraser or select tools
                    ...(prev.tool === 'eraser' || prev.tool === 'select' ? { tool: 'pen' } : {}),
                    symbolMirrored: false // Reset mirroring when selecting different symbol
                  }));
                }
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center relative">
                {symbolPreviews[symbol.id] ? (
                  <img 
                    src={symbolPreviews[symbol.id]} 
                    alt={symbol.label}
                    className="w-8 h-8"
                  />
                ) : (
                  <div className="w-4 h-4 bg-craft-300 rounded animate-pulse" />
                )}
                {/* Mirroring indicator */}
                {(symbol.id === '2dctog' || symbol.id === '3dctog') && 
                 canvasState.symbol === symbol.id && 
                 canvasState.symbolMirrored && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
                    M
                  </div>
                )}
              </div>
              <span className="text-xs text-craft-600">{symbol.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Selection Controls */}
      {canvasState.tool === 'select' && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-craft-700 mb-3">Selection Actions</h3>
          <div className="flex gap-2">
            <Button
              onClick={onCopySelection}
              disabled={!hasSelection}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              onClick={() => onPasteSelection?.()}
              disabled={!hasCopiedSymbols}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Clipboard className="h-4 w-4 mr-1" />
              Paste
            </Button>
          </div>
          <p className="text-xs text-craft-600 mt-2">
            Use Ctrl+C to copy, Ctrl+V to paste, Esc to clear selection
          </p>
        </div>
      )}

      {/* Color Palette */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-craft-700 mb-3">
          Yarn Colors
          {canvasState.tool === 'select' && hasSelection && (
            <span className="text-xs text-accent ml-2">(changes selected symbols)</span>
          )}
        </h3>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {colors.map((color) => (
            <button
              key={color.value}
              className={cn(
                "w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 touch-manipulation active:scale-95",
                canvasState.color === color.value
                  ? "border-craft-800 ring-2 ring-accent"
                  : "border-craft-300"
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => setCanvasState(prev => ({ ...prev, color: color.value }))}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Grid Settings */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-craft-700 mb-3">Grid Settings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-craft-600">Show Grid</span>
            <button
              onClick={() => setCanvasState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
              className={cn(
                "w-10 h-6 rounded-full relative transition-colors",
                canvasState.showGrid ? "bg-accent" : "bg-craft-200"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                  canvasState.showGrid ? "translate-x-5" : "translate-x-1"
                )}
              />
            </button>
          </div>
          
          <div>
            <Label className="text-sm text-craft-600">Grid Size: {canvasState.gridSize}px</Label>
            <input
              type="range"
              min="1"
              max="30"
              value={canvasState.gridSize}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setCanvasState(prev => ({ ...prev, gridSize: value }));
                // Update the pattern manager grid size
                simplePattern.setGridSize(value);
                onPatternChange();
              }}
              className="w-full h-2 bg-craft-200 rounded-lg appearance-none cursor-pointer slider mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-craft-600">Grid Style</Label>
            <Select
              value={canvasState.gridStyle}
              onValueChange={(value: 'basic' | 'every10' | 'every50') => 
                setCanvasState(prev => ({ ...prev, gridStyle: value }))
              }
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Grid</SelectItem>
                <SelectItem value="every10">Highlight Every 10</SelectItem>
                <SelectItem value="every50">Highlight 10 & 50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Canvas Size Controls */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-craft-700 mb-3">Canvas Size</h3>
        <div className="space-y-4">
          {/* Rows Controls */}
          <div>
            <Label className="text-sm text-craft-600">Rows: {canvasState.canvasRows}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  simplePattern.addRowTop();
                  simplePattern.saveToHistory();
                  onPatternChange();
                }}
                className="flex-1"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Top
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (simplePattern.removeRowTop()) {
                    simplePattern.saveToHistory();
                    onPatternChange();
                  }
                }}
                className="flex-1"
              >
                <Minus className="w-3 h-3 mr-1" />
                Remove Top
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  simplePattern.addRowBottom();
                  simplePattern.saveToHistory();
                  onPatternChange();
                }}
                className="flex-1"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Bottom
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (simplePattern.removeRowBottom()) {
                    simplePattern.saveToHistory();
                    onPatternChange();
                  }
                }}
                className="flex-1"
              >
                <Minus className="w-3 h-3 mr-1" />
                Remove Bottom
              </Button>
            </div>
            <Input
              type="number"
              min="1"
              max="100"
              value={canvasState.canvasRows}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                simplePattern.setRows(value);
                simplePattern.saveToHistory();
                onPatternChange();
              }}
              placeholder="Set rows"
              className="mt-2"
            />
          </div>

          {/* Columns Controls */}
          <div>
            <Label className="text-sm text-craft-600">Columns: {canvasState.canvasCols}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  simplePattern.addColumnLeft();
                  onPatternChange();
                }}
                className="flex-1"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  simplePattern.addColumnRight();
                  simplePattern.saveToHistory();
                  onPatternChange();
                }}
                className="flex-1"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Right
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (simplePattern.removeColumnLeft()) {
                    onPatternChange();
                  }
                }}
                className="flex-1"
              >
                <Minus className="w-3 h-3 mr-1" />
                Remove Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (simplePattern.removeColumnRight()) {
                    simplePattern.saveToHistory();
                    onPatternChange();
                  }
                }}
                className="flex-1"
              >
                <Minus className="w-3 h-3 mr-1" />
                Remove Right
              </Button>
            </div>
            <Input
              type="number"
              min="1"
              max="200"
              value={canvasState.canvasCols}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                simplePattern.setCols(value);
                simplePattern.saveToHistory();
                onPatternChange();
              }}
              placeholder="Set columns"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Clear Canvas */}
      <div>
        <Button
          onClick={onClearCanvas}
          variant="outline"
          className="w-full text-craft-600 border-craft-300 hover:bg-craft-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Canvas
        </Button>
      </div>
    </div>
  );
}
