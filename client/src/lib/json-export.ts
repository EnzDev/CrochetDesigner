// JSON export functionality for crochet patterns

import type { SimplePattern, SimpleSymbol } from './simple-pattern';

export interface ExportedPattern {
  metadata: {
    title: string;
    description?: string;
    hookSize: string;
    yarnWeight: string;
    gauge?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    notes?: string;
    materials: string[];
    exportedAt: string;
    version: string;
  };
  pattern: {
    rows: number;
    cols: number;
    startCol: number;
    gridSize: number;
    symbols: SimpleSymbol[];
    canvasData?: string; // Base64 canvas image
  };
  settings: {
    showGrid: boolean;
    gridStyle: 'basic' | 'every10' | 'every50';
    zoom: number;
  };
}

export const exportPatternAsJSON = (
  pattern: SimplePattern,
  metadata: any,
  settings: any,
  canvasData?: string
): string => {
  const exportData: ExportedPattern = {
    metadata: {
      title: metadata.title || 'Untitled Pattern',
      description: metadata.description,
      hookSize: metadata.hookSize || '5.0mm (H)',
      yarnWeight: metadata.yarnWeight || 'Medium (4)',
      gauge: metadata.gauge,
      difficulty: metadata.difficulty || 'intermediate',
      notes: metadata.notes,
      materials: metadata.materials || [],
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    },
    pattern: {
      rows: pattern.rows,
      cols: pattern.cols,
      startCol: pattern.startCol,
      gridSize: pattern.gridSize,
      symbols: pattern.symbols.filter(s => s.symbol !== 'occupied'), // Exclude occupied markers
      canvasData
    },
    settings: {
      showGrid: settings.showGrid ?? true,
      gridStyle: settings.gridStyle || 'basic',
      zoom: settings.zoom || 100
    }
  };

  return JSON.stringify(exportData, null, 2);
};

export const downloadJSON = (jsonString: string, filename: string) => {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
};

export const importPatternFromJSON = (jsonString: string): ExportedPattern | null => {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate the structure
    if (!data.metadata || !data.pattern || !data.pattern.symbols) {
      throw new Error('Invalid pattern format');
    }
    
    return data as ExportedPattern;
  } catch (error) {
    console.error('Failed to parse pattern JSON:', error);
    return null;
  }
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};