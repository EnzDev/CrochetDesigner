import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatternInfo } from "@/pages/pattern-designer";
import { useState } from "react";

interface PatternInfoPanelProps {
  patternInfo: PatternInfo;
  setPatternInfo: (info: PatternInfo | ((prev: PatternInfo) => PatternInfo)) => void;
}

export default function PatternInfoPanel({ patternInfo, setPatternInfo }: PatternInfoPanelProps) {
  const [newMaterial, setNewMaterial] = useState('');

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ] as const;

  const hookSizes = [
    '2.25mm (B)',
    '2.75mm (C)',
    '3.25mm (D)',
    '3.5mm (E)',
    '4.0mm (F)',
    '4.5mm (G)',
    '5.0mm (H)',
    '5.5mm (I)',
    '6.0mm (J)',
    '6.5mm (K)',
    '8.0mm (L)',
    '9.0mm (M)',
    '10.0mm (N)',
  ];

  const yarnWeights = [
    'Lace (0)',
    'Super Fine (1)',
    'Fine (2)',
    'Light (3)',
    'Medium (4)',
    'Bulky (5)',
    'Super Bulky (6)',
  ];

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setPatternInfo(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setPatternInfo(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="w-80 min-w-0 flex-shrink-0 bg-white border-l border-craft-200 p-4 overflow-y-auto max-h-screen md:w-80 sm:w-72 xs:w-64">
      <h3 className="text-lg font-medium text-craft-800 mb-4">Pattern Information</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium text-craft-700">
            Pattern Title
          </Label>
          <Input
            id="title"
            type="text"
            placeholder="My Crochet Pattern"
            value={patternInfo.title}
            onChange={(e) => setPatternInfo(prev => ({ ...prev, title: e.target.value }))}
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="hookSize" className="text-sm font-medium text-craft-700">
              Hook Size
            </Label>
            <Select
              value={patternInfo.hookSize}
              onValueChange={(value) => setPatternInfo(prev => ({ ...prev, hookSize: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hookSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="yarnWeight" className="text-sm font-medium text-craft-700">
              Yarn Weight
            </Label>
            <Select
              value={patternInfo.yarnWeight}
              onValueChange={(value) => setPatternInfo(prev => ({ ...prev, yarnWeight: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yarnWeights.map((weight) => (
                  <SelectItem key={weight} value={weight}>
                    {weight}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="gauge" className="text-sm font-medium text-craft-700">
            Gauge
          </Label>
          <Input
            id="gauge"
            type="text"
            placeholder="18 sts × 24 rows = 4 inches"
            value={patternInfo.gauge}
            onChange={(e) => setPatternInfo(prev => ({ ...prev, gauge: e.target.value }))}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-craft-700 mb-2 block">
            Difficulty
          </Label>
          <div className="flex space-x-2">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty.value}
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 text-xs",
                  patternInfo.difficulty === difficulty.value
                    ? "bg-accent text-white border-accent"
                    : "border-craft-200 hover:border-accent"
                )}
                onClick={() => setPatternInfo(prev => ({ ...prev, difficulty: difficulty.value }))}
              >
                {difficulty.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes" className="text-sm font-medium text-craft-700">
            Pattern Notes
          </Label>
          <Textarea
            id="notes"
            rows={4}
            placeholder="Add special instructions, notes, or techniques used in this pattern..."
            value={patternInfo.notes}
            onChange={(e) => setPatternInfo(prev => ({ ...prev, notes: e.target.value }))}
            className="mt-1 resize-none"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-craft-700 mb-2 block">
            Materials Used
          </Label>
          <div className="space-y-2">
            {patternInfo.materials.map((material, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-craft-50 rounded-lg">
                <span className="text-sm">{material}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMaterial(index)}
                  className="text-craft-400 hover:text-red-500 h-auto p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g., Worsted Weight Yarn - White"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMaterial()}
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addMaterial}
                disabled={!newMaterial.trim()}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-craft-200">
          <h4 className="text-sm font-medium text-craft-700 mb-3">Pattern Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-craft-50 p-3 rounded-lg">
              <div className="text-craft-500 text-xs">Stitches</div>
              <div className="font-medium">0</div>
            </div>
            <div className="bg-craft-50 p-3 rounded-lg">
              <div className="text-craft-500 text-xs">Rows</div>
              <div className="font-medium">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
