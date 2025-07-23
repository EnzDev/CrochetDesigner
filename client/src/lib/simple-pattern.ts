// Simple, reliable pattern management without DDD complexity

export interface SimpleSymbol {
  row: number;
  col: number;
  symbol: string;
  color: string;
}

export interface SimplePattern {
  symbols: SimpleSymbol[];
  rows: number;
  cols: number;
  gridSize: number;
}

export class SimplePatternManager {
  private pattern: SimplePattern;
  private history: SimplePattern[] = [];
  private historyIndex: number = -1;
  private maxHistory = 20;

  constructor(rows = 3, cols = 40, gridSize = 20) {
    this.pattern = {
      symbols: [],
      rows,
      cols,
      gridSize
    };
    this.saveToHistory();
  }

  // Get current pattern state
  getPattern(): SimplePattern {
    return { ...this.pattern, symbols: [...this.pattern.symbols] };
  }

  // Place a symbol
  placeSymbol(row: number, col: number, symbol: string, color: string): void {
    // Remove any existing symbol at this position
    this.pattern.symbols = this.pattern.symbols.filter(s => 
      !(s.row === row && s.col === col)
    );

    // Add the new symbol
    this.pattern.symbols.push({ row, col, symbol, color });
  }

  // Remove a symbol
  removeSymbol(row: number, col: number): boolean {
    const initialLength = this.pattern.symbols.length;
    this.pattern.symbols = this.pattern.symbols.filter(s => 
      !(s.row === row && s.col === col)
    );

    return this.pattern.symbols.length < initialLength;
  }

  // Manual grid size controls
  addRowTop(): void {
    // Shift all symbols down by 1
    this.pattern.symbols = this.pattern.symbols.map(s => ({
      ...s,
      row: s.row + 1
    }));
    this.pattern.rows++;
  }

  addRowBottom(): void {
    this.pattern.rows++;
  }

  removeRowTop(): boolean {
    if (this.pattern.rows <= 1) return false;
    
    // Remove symbols from top row
    this.pattern.symbols = this.pattern.symbols.filter(s => s.row !== 0);
    
    // Shift remaining symbols up
    this.pattern.symbols = this.pattern.symbols.map(s => ({
      ...s,
      row: s.row - 1
    }));
    
    this.pattern.rows--;
    return true;
  }

  removeRowBottom(): boolean {
    if (this.pattern.rows <= 1) return false;
    
    // Remove symbols from bottom row
    this.pattern.symbols = this.pattern.symbols.filter(s => s.row !== this.pattern.rows - 1);
    
    this.pattern.rows--;
    return true;
  }

  addColumnRight(): void {
    this.pattern.cols++;
  }

  removeColumnRight(): boolean {
    if (this.pattern.cols <= 1) return false;
    
    // Remove symbols from rightmost column
    this.pattern.symbols = this.pattern.symbols.filter(s => s.col !== this.pattern.cols - 1);
    
    this.pattern.cols--;
    return true;
  }

  setRows(rows: number): void {
    if (rows < 1) return;
    this.pattern.rows = rows;
    // Remove symbols that are now out of bounds
    this.pattern.symbols = this.pattern.symbols.filter(s => s.row < rows);
  }

  setCols(cols: number): void {
    if (cols < 1) return;
    this.pattern.cols = cols;
    // Remove symbols that are now out of bounds
    this.pattern.symbols = this.pattern.symbols.filter(s => s.col < cols);
  }

  setGridSize(gridSize: number): void {
    if (gridSize < 1 || gridSize > 30) return;
    this.pattern.gridSize = gridSize;
  }

  // Fill rectangle
  fillRectangle(startRow: number, startCol: number, endRow: number, endCol: number, symbol: string, color: string): void {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Place all symbols
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        // Remove existing symbol at this position
        this.pattern.symbols = this.pattern.symbols.filter(s => 
          !(s.row === row && s.col === col)
        );
        // Add new symbol
        this.pattern.symbols.push({ row, col, symbol, color });
      }
    }
  }

  // Clear all symbols
  clear(): void {
    this.pattern = {
      symbols: [],
      rows: 3,
      cols: this.pattern.cols,
      gridSize: this.pattern.gridSize
    };
  }

  // History management
  saveToHistory(): void {
    // Remove future history
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add current state
    this.history.push({
      symbols: [...this.pattern.symbols],
      rows: this.pattern.rows,
      cols: this.pattern.cols,
      gridSize: this.pattern.gridSize
    });

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.pattern = {
        symbols: [...this.history[this.historyIndex].symbols],
        rows: this.history[this.historyIndex].rows,
        cols: this.history[this.historyIndex].cols,
        gridSize: this.history[this.historyIndex].gridSize
      };
      return true;
    }
    return false;
  }

  redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.pattern = {
        symbols: [...this.history[this.historyIndex].symbols],
        rows: this.history[this.historyIndex].rows,
        cols: this.history[this.historyIndex].cols,
        gridSize: this.history[this.historyIndex].gridSize
      };
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Load pattern
  loadPattern(data: { symbols: SimpleSymbol[]; rows: number; cols: number; gridSize: number }): void {
    this.pattern = {
      symbols: [...data.symbols],
      rows: data.rows,
      cols: data.cols,
      gridSize: data.gridSize
    };
    this.saveToHistory();
  }

  // Export pattern
  exportPattern(): { symbols: SimpleSymbol[]; rows: number; cols: number; gridSize: number } {
    return {
      symbols: [...this.pattern.symbols],
      rows: this.pattern.rows,
      cols: this.pattern.cols,
      gridSize: this.pattern.gridSize
    };
  }
}

// Global instance
export const simplePattern = new SimplePatternManager();