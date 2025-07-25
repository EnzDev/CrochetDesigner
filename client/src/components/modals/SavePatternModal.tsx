import { useState, useRef } from 'react';
import { X, Save, FolderOpen, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SavePatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  patternInfo: any;
  setPatternInfo: (info: any) => void;
  onSave: () => void;
  onLoad: (pattern: any) => void;
  onExportImage: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  isLoading: boolean;
}

export function SavePatternModal({
  isOpen,
  onClose,
  patternInfo,
  setPatternInfo,
  onSave,
  onLoad,
  onExportImage,
  onExportJSON,
  onImportJSON,
  isLoading
}: SavePatternModalProps) {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'export'>('save');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: patterns = [] } = useQuery({
    queryKey: ['/api/patterns'],
    enabled: isOpen && activeTab === 'load'
  }) as { data: any[] };

  const deletePatternMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/patterns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      toast({
        title: "Pattern deleted",
        description: "Pattern has been removed from your device.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete pattern.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!patternInfo?.title?.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your pattern.",
        variant: "destructive",
      });
      return;
    }
    onSave();
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePatternMutation.mutate(id);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      onImportJSON(file);
      onClose();
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a valid JSON file.",
        variant: "destructive",
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pattern Manager</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeTab === 'save' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('save')}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            variant={activeTab === 'load' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('load')}
            className="flex-1"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Load
          </Button>
          <Button
            variant={activeTab === 'export' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('export')}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Save Tab */}
        {activeTab === 'save' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Pattern Title *</Label>
                <Input
                  id="title"
                  value={patternInfo?.title || ''}
                  onChange={(e) => setPatternInfo({...patternInfo, title: e.target.value})}
                  placeholder="Enter pattern title"
                />
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={patternInfo?.difficulty || 'beginner'} 
                  onValueChange={(value) => setPatternInfo({...patternInfo, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hookSize">Hook Size</Label>
                <Input
                  id="hookSize"
                  value={patternInfo?.hookSize || ''}
                  onChange={(e) => setPatternInfo({...patternInfo, hookSize: e.target.value})}
                  placeholder="e.g., 5.0mm (H)"
                />
              </div>

              <div>
                <Label htmlFor="yarnWeight">Yarn Weight</Label>
                <Select 
                  value={patternInfo?.yarnWeight || 'Medium (4)'} 
                  onValueChange={(value) => setPatternInfo({...patternInfo, yarnWeight: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select yarn weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lace (0)">Lace (0)</SelectItem>
                    <SelectItem value="Light (1)">Light (1)</SelectItem>
                    <SelectItem value="Fine (2)">Fine (2)</SelectItem>
                    <SelectItem value="Light (3)">Light (3)</SelectItem>
                    <SelectItem value="Medium (4)">Medium (4)</SelectItem>
                    <SelectItem value="Bulky (5)">Bulky (5)</SelectItem>
                    <SelectItem value="Super Bulky (6)">Super Bulky (6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={patternInfo?.description || ''}
                onChange={(e) => setPatternInfo({...patternInfo, description: e.target.value})}
                placeholder="Describe your pattern..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Pattern"}
              </Button>
            </div>
          </div>
        )}

        {/* Load Tab */}
        {activeTab === 'load' && (
          <div className="space-y-4">
            {patterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No saved patterns found</p>
                <p className="text-sm">Create and save your first pattern to see it here</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {patterns.map((pattern: any) => (
                  <div key={pattern.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{pattern.title}</h3>
                        {pattern.description && (
                          <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {pattern.difficulty && (
                            <span className="capitalize">{pattern.difficulty}</span>
                          )}
                          {pattern.hookSize && <span>{pattern.hookSize}</span>}
                          {pattern.yarnWeight && <span>{pattern.yarnWeight}</span>}
                          {pattern.createdAt && (
                            <span>
                              {new Date(pattern.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            onLoad(pattern);
                            onClose();
                          }}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(pattern.id, pattern.title)}
                          disabled={deletePatternMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="text-center py-4">
                <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Export Your Pattern</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose how you'd like to export your crochet pattern
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    onExportImage();
                    onClose();
                  }}
                  className="flex flex-col items-center p-6 h-auto bg-accent hover:bg-accent/90"
                >
                  <Download className="w-8 h-8 mb-2" />
                  <span className="font-medium">Export as PNG</span>
                  <span className="text-xs opacity-80">Image file for sharing</span>
                </Button>

                <Button
                  onClick={() => {
                    onExportJSON();
                    onClose();
                  }}
                  variant="outline"
                  className="flex flex-col items-center p-6 h-auto"
                >
                  <Download className="w-8 h-8 mb-2" />
                  <span className="font-medium">Export as JSON</span>
                  <span className="text-xs opacity-80">Data file for backup</span>
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Import Pattern</h4>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import JSON Pattern
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Import a pattern from a previously exported JSON file
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}