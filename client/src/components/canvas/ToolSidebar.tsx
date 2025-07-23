import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pen, Eraser, PaintBucket, MousePointer, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasState } from "@/pages/pattern-designer";

interface ToolSidebarProps {
  canvasState: CanvasState;
  setCanvasState: (state: CanvasState | ((prev: CanvasState) => CanvasState)) => void;
  onClearCanvas: () => void;
}

export default function ToolSidebar({ canvasState, setCanvasState, onClearCanvas }: ToolSidebarProps) {
  const tools = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'select', icon: MousePointer, label: 'Select' },
  ] as const;

  const symbols = [
    { id: 'chain', label: 'Chain', preview: 'ch' },
    { id: 'sc', label: 'SC', preview: 'sc' },
    { id: 'dc', label: 'DC', preview: 'dc' },
    { id: 'tr', label: 'TR', preview: 'tr' },
    { id: 'sl', label: 'SL ST', preview: 'sl' },
    { id: 'yo', label: 'YO', preview: 'yo' },
  ];

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
    <div className="w-72 min-w-0 flex-shrink-0 bg-white border-r border-craft-200 p-4 overflow-y-auto max-h-screen md:w-72 sm:w-64 xs:w-56">
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
                onClick={() => setCanvasState(prev => ({ ...prev, tool: tool.id as any }))}
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
                setCanvasState(prev => ({ 
                  ...prev, 
                  symbol: prev.symbol === symbol.id ? null : symbol.id,
                  tool: 'pen'
                }));
              }}
            >
              <div className="w-6 h-6 flex items-center justify-center text-xs font-mono">
                {symbol.preview}
              </div>
              <span className="text-xs text-craft-600">{symbol.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-craft-700 mb-3">Yarn Colors</h3>
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

      {/* Grid Controls */}
      <div>
        <h3 className="text-sm font-medium text-craft-700 mb-3">Grid Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-craft-600 mb-1">Grid Size</label>
            <Select
              value={canvasState.gridSize.toString()}
              onValueChange={(value) => 
                setCanvasState(prev => ({ ...prev, gridSize: parseInt(value) }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10px</SelectItem>
                <SelectItem value="15">15px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="25">25px</SelectItem>
                <SelectItem value="30">30px</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setCanvasState(prev => ({ ...prev, showGrid: !prev.showGrid }))}
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            {canvasState.showGrid ? 'Hide Grid' : 'Show Grid'}
          </Button>
        </div>
      </div>
    </div>
  );
}
