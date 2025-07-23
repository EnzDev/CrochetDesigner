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
    // If placing on top row (row 0), add a new row and shift everything down
    if (row === 0) {
      // Shift all existing symbols down by 1
      this.pattern.symbols = this.pattern.symbols.map(s => ({
        ...s,
        row: s.row + 1
      }));
      // Increase row count
      this.pattern.rows++;
    }

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

    const removed = this.pattern.symbols.length < initialLength;

    // Check if we can remove empty top rows
    if (removed) {
      this.contractRows();
    }

    return removed;
  }

  // Contract empty top rows
  private contractRows(): void {
    const minRows = 3;
    let emptyTopRows = 0;

    // Count empty top rows
    for (let row = 0; row < this.pattern.rows - minRows; row++) {
      const hasSymbol = this.pattern.symbols.some(s => s.row === row);
      if (hasSymbol) break;
      emptyTopRows++;
    }

    // Remove empty top rows and shift symbols up
    if (emptyTopRows > 0) {
      this.pattern.symbols = this.pattern.symbols.map(s => ({
        ...s,
        row: s.row - emptyTopRows
      }));
      this.pattern.rows -= emptyTopRows;
    }
  }

  // Fill rectangle
  fillRectangle(startRow: number, startCol: number, endRow: number, endCol: number, symbol: string, color: string): void {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // If filling starts at row 0, add a row and shift everything
    if (minRow === 0) {
      this.pattern.symbols = this.pattern.symbols.map(s => ({
        ...s,
        row: s.row + 1
      }));
      this.pattern.rows++;
    }

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