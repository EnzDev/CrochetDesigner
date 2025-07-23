import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Download, FolderOpen, Save } from "lucide-react";
import PatternCanvas from "@/components/canvas/PatternCanvas";
import ToolSidebar from "@/components/canvas/ToolSidebar";
import PatternInfoPanel from "@/components/canvas/PatternInfoPanel";
import SavePatternModal from "@/components/modals/SavePatternModal";
import type { Pattern, InsertPattern } from "@shared/schema";

export interface CanvasState {
  tool: 'pen' | 'eraser' | 'fill' | 'select';
  symbol: string | null;
  color: string;
  gridSize: number;
  showGrid: boolean;
  zoom: number;
}

export interface PatternInfo {
  title: string;
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
  });

  const [patternInfo, setPatternInfo] = useState<PatternInfo>({
    title: '',
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
    mutationFn: async (data: InsertPattern) => {
      const response = await apiRequest('POST', '/api/patterns', data);
      return response.json();
    },
    onSuccess: (pattern: Pattern) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      setCurrentPatternId(pattern.id);
      toast({
        title: "Pattern saved",
        description: `"${pattern.title}" has been saved successfully.`,
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertPattern> }) => {
      const response = await apiRequest('PATCH', `/api/patterns/${id}`, data);
      return response.json();
    },
    onSuccess: (pattern: Pattern) => {
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      toast({
        title: "Pattern updated",
        description: `"${pattern.title}" has been updated successfully.`,
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

    const data: InsertPattern = {
      ...patternInfo,
      canvasData,
      patternData: patternData as any,
      gridSize: canvasState.gridSize,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
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
        // Redraw grid if enabled
        if (canvasState.showGrid) {
          ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
          ctx.lineWidth = 1;
          
          for (let x = 0; x <= canvas.width; x += canvasState.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          
          for (let y = 0; y <= canvas.height; y += canvasState.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        }
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
              disabled={savePatternMutation.isPending || updatePatternMutation.isPending}
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
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
        />
        
        <PatternInfoPanel
          patternInfo={patternInfo}
          setPatternInfo={setPatternInfo}
        />
      </div>

      <SavePatternModal
        open={showSaveModal}
        onOpenChange={setShowSaveModal}
        onSave={handleSaveCanvas}
        patterns={patterns as Pattern[] || []}
        onLoadPattern={(pattern) => {
          setPatternInfo({
            title: pattern.title,
            hookSize: pattern.hookSize,
            yarnWeight: pattern.yarnWeight,
            gauge: pattern.gauge || '',
            difficulty: pattern.difficulty as 'beginner' | 'intermediate' | 'advanced',
            notes: pattern.notes || '',
            materials: pattern.materials || [],
          });
          setCurrentPatternId(pattern.id);
          
          // Load canvas data
          if (canvasRef.current && pattern.canvasData) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.onload = () => {
                ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                ctx.drawImage(img, 0, 0);
              };
              img.src = pattern.canvasData;
            }
          }
          
          // Load pattern state
          if (pattern.patternData) {
            if (pattern.patternData.canvasState) {
              setCanvasState(pattern.patternData.canvasState);
            }
            if (pattern.patternData.history) {
              setHistory(pattern.patternData.history);
              setHistoryIndex(pattern.patternData.history.length - 1);
            }
          }
          
          setShowSaveModal(false);
          toast({
            title: "Pattern loaded",
            description: `"${pattern.title}" has been loaded successfully.`,
          });
        }}
      />
    </div>
  );
}
