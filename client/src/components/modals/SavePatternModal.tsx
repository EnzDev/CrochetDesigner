import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Save, FileImage, FileText, FolderOpen } from "lucide-react";
import type { Pattern } from "@shared/schema";

interface SavePatternModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  patterns: Pattern[];
  onLoadPattern: (pattern: Pattern) => void;
}

export default function SavePatternModal({ 
  open, 
  onOpenChange, 
  onSave, 
  patterns, 
  onLoadPattern 
}: SavePatternModalProps) {
  const [mode, setMode] = useState<'save' | 'load'>('save');
  const [fileName, setFileName] = useState('');
  const [exportFormat, setExportFormat] = useState('json');

  const handleSave = () => {
    onSave();
  };

  const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'save' ? (
              <>
                <Save className="w-5 h-5" />
                Save Pattern
              </>
            ) : (
              <>
                <FolderOpen className="w-5 h-5" />
                Load Pattern
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'save' ? 'default' : 'outline'}
              onClick={() => setMode('save')}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Save New
            </Button>
            <Button
              variant={mode === 'load' ? 'default' : 'outline'}
              onClick={() => setMode('load')}
              className="flex-1"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Load Existing
            </Button>
          </div>

          {mode === 'save' ? (
            // Save Mode
            <div className="space-y-4">
              <div>
                <Label htmlFor="fileName" className="text-sm font-medium">
                  File Name
                </Label>
                <Input
                  id="fileName"
                  type="text"
                  placeholder="my-crochet-pattern"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="format" className="text-sm font-medium">
                  Export Format
                </Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Pattern File (.json)
                      </div>
                    </SelectItem>
                    <SelectItem value="png">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-4 h-4" />
                        Image (.png)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  Save Pattern
                </Button>
              </div>
            </div>
          ) : (
            // Load Mode
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Saved Patterns
                </Label>
                <ScrollArea className="h-64 border rounded-lg">
                  <div className="p-2 space-y-2">
                    {patterns.length === 0 ? (
                      <div className="text-center py-8 text-craft-500">
                        No saved patterns found
                      </div>
                    ) : (
                      patterns.map((pattern) => (
                        <Card
                          key={pattern.id}
                          className="cursor-pointer hover:bg-craft-50 transition-colors"
                          onClick={() => onLoadPattern(pattern)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-craft-800">
                                  {pattern.title || `Pattern ${pattern.id}`}
                                </h4>
                                <p className="text-sm text-craft-600">
                                  {pattern.hookSize} • {pattern.yarnWeight} • {pattern.difficulty}
                                </p>
                                {pattern.notes && (
                                  <p className="text-xs text-craft-500 mt-1 line-clamp-2">
                                    {pattern.notes}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-craft-400">
                                ID: {pattern.id}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
