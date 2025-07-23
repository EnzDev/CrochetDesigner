// Domain-Driven Design for Pattern Management
// This ensures proper state management and prevents ghost symbols

export interface PatternSymbol {
  id: string;
  symbolType: string;
  color: string;
  row: number;
  col: number;
}

export interface PatternGrid {
  symbols: Map<string, PatternSymbol>;
  rows: number;
  cols: number;
  gridSize: number;
}

export interface PatternState {
  grid: PatternGrid;
  history: PatternGrid[];
  historyIndex: number;
  maxHistorySize: number;
}

export class PatternDomain {
  private state: PatternState;
  private listeners: Array<(state: PatternState) => void> = [];

  constructor(rows: number = 3, cols: number = 40, gridSize: number = 20) {
    this.state = {
      grid: {
        symbols: new Map(),
        rows,
        cols,
        gridSize
      },
      history: [],
      historyIndex: -1,
      maxHistorySize: 50
    };
    this.saveToHistory();
  }

  // Subscribe to state changes
  subscribe(listener: (state: PatternState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Get current state (read-only)
  getState(): Readonly<PatternState> {
    return { ...this.state };
  }

  // Get grid key for symbol position
  private getGridKey(row: number, col: number): string {
    return `${row}-${col}`;
  }

  // Place a symbol at specific position
  placeSymbol(row: number, col: number, symbolType: string, color: string): void {
    const symbolId = `symbol_${Date.now()}_${Math.random()}`;
    
    // Simple approach: if placing on row 0, just add a row and shift everything down
    if (row === 0) {
      // First, shift all existing symbols down by 1
      const newSymbols = new Map<string, PatternSymbol>();
      this.state.grid.symbols.forEach((symbol) => {
        const shiftedSymbol: PatternSymbol = {
          ...symbol,
          row: symbol.row + 1
        };
        const newKey = this.getGridKey(shiftedSymbol.row, shiftedSymbol.col);
        newSymbols.set(newKey, shiftedSymbol);
      });

      // Add the new symbol at row 0
      const newSymbol: PatternSymbol = {
        id: symbolId,
        symbolType,
        color,
        row: 0,
        col
      };
      const key = this.getGridKey(0, col);
      newSymbols.set(key, newSymbol);

      // Update grid with new symbols and increased row count
      this.state.grid = {
        ...this.state.grid,
        symbols: newSymbols,
        rows: this.state.grid.rows + 1
      };
    } else {
      // Normal placement for non-top rows
      const key = this.getGridKey(row, col);
      const symbol: PatternSymbol = {
        id: symbolId,
        symbolType,
        color,
        row,
        col
      };

      const newSymbols = new Map(this.state.grid.symbols);
      newSymbols.set(key, symbol);

      this.state.grid = {
        ...this.state.grid,
        symbols: newSymbols
      };
    }

    this.notify();
  }

  // Remove symbol at specific position
  removeSymbol(row: number, col: number): boolean {
    const key = this.getGridKey(row, col);
    const newSymbols = new Map(this.state.grid.symbols);
    const removed = newSymbols.delete(key);

    if (removed) {
      this.state.grid = {
        ...this.state.grid,
        symbols: newSymbols
      };

      // Check if we can contract rows
      this.contractIfPossible();
      this.notify();
    }

    return removed;
  }

  // Remove this method since we're handling expansion directly in placeSymbol

  // Contract grid if top rows are empty
  private contractIfPossible(): void {
    let emptyTopRows = 0;
    const minRows = 3;

    // Count empty top rows
    for (let row = 0; row < this.state.grid.rows - minRows; row++) {
      let rowHasSymbols = false;
      for (let col = 0; col < this.state.grid.cols; col++) {
        const key = this.getGridKey(row, col);
        if (this.state.grid.symbols.has(key)) {
          rowHasSymbols = true;
          break;
        }
      }
      if (rowHasSymbols) break;
      emptyTopRows++;
    }

    // Remove empty top rows
    if (emptyTopRows > 0) {
      const newSymbols = new Map<string, PatternSymbol>();

      this.state.grid.symbols.forEach((symbol) => {
        const newSymbol: PatternSymbol = {
          ...symbol,
          row: symbol.row - emptyTopRows
        };
        const newKey = this.getGridKey(newSymbol.row, newSymbol.col);
        newSymbols.set(newKey, newSymbol);
      });

      this.state.grid = {
        ...this.state.grid,
        symbols: newSymbols,
        rows: this.state.grid.rows - emptyTopRows
      };
    }
  }

  // Fill rectangle with symbols
  fillRectangle(startRow: number, startCol: number, endRow: number, endCol: number, symbolType: string, color: string): void {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    // Calculate how many new rows we need if filling starts at row 0
    let rowsToAdd = 0;
    if (minRow === 0) {
      rowsToAdd = 1;
    }

    // If we need to add rows, do it once at the beginning
    if (rowsToAdd > 0) {
      // Shift all existing symbols down
      const newSymbols = new Map<string, PatternSymbol>();
      this.state.grid.symbols.forEach((symbol) => {
        const shiftedSymbol: PatternSymbol = {
          ...symbol,
          row: symbol.row + rowsToAdd
        };
        const newKey = this.getGridKey(shiftedSymbol.row, shiftedSymbol.col);
        newSymbols.set(newKey, shiftedSymbol);
      });

      this.state.grid = {
        ...this.state.grid,
        symbols: newSymbols,
        rows: this.state.grid.rows + rowsToAdd
      };
    }

    // Now place all symbols normally (no more row expansion needed)
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const symbolId = `fill_symbol_${Date.now()}_${row}_${col}`;
        const key = this.getGridKey(row, col);
        const symbol: PatternSymbol = {
          id: symbolId,
          symbolType,
          color,
          row,
          col
        };

        const newSymbols = new Map(this.state.grid.symbols);
        newSymbols.set(key, symbol);

        this.state.grid = {
          ...this.state.grid,
          symbols: newSymbols
        };
      }
    }

    this.saveToHistory();
    this.notify();
  }

  // Clear all symbols
  clearAll(): void {
    this.state.grid = {
      symbols: new Map(),
      rows: 3, // Reset to minimum rows
      cols: this.state.grid.cols,
      gridSize: this.state.grid.gridSize
    };
    this.saveToHistory();
    this.notify();
  }

  // History management
  saveToHistory(): void {
    // Remove future history if we're not at the end
    const newHistory = this.state.history.slice(0, this.state.historyIndex + 1);
    
    // Add current state to history
    const gridCopy: PatternGrid = {
      symbols: new Map(this.state.grid.symbols),
      rows: this.state.grid.rows,
      cols: this.state.grid.cols,
      gridSize: this.state.grid.gridSize
    };
    
    newHistory.push(gridCopy);
    
    // Limit history size
    if (newHistory.length > this.state.maxHistorySize) {
      newHistory.shift();
    }
    
    this.state.history = newHistory;
    this.state.historyIndex = newHistory.length - 1;
  }

  // Undo operation
  undo(): boolean {
    if (this.state.historyIndex > 0) {
      this.state.historyIndex--;
      this.state.grid = {
        symbols: new Map(this.state.history[this.state.historyIndex].symbols),
        rows: this.state.history[this.state.historyIndex].rows,
        cols: this.state.history[this.state.historyIndex].cols,
        gridSize: this.state.history[this.state.historyIndex].gridSize
      };
      this.notify();
      return true;
    }
    return false;
  }

  // Redo operation
  redo(): boolean {
    if (this.state.historyIndex < this.state.history.length - 1) {
      this.state.historyIndex++;
      this.state.grid = {
        symbols: new Map(this.state.history[this.state.historyIndex].symbols),
        rows: this.state.history[this.state.historyIndex].rows,
        cols: this.state.history[this.state.historyIndex].cols,
        gridSize: this.state.history[this.state.historyIndex].gridSize
      };
      this.notify();
      return true;
    }
    return false;
  }

  // Check if undo/redo is available
  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  // Get symbol at position
  getSymbolAt(row: number, col: number): PatternSymbol | undefined {
    const key = this.getGridKey(row, col);
    return this.state.grid.symbols.get(key);
  }

  // Get all symbols
  getAllSymbols(): PatternSymbol[] {
    return Array.from(this.state.grid.symbols.values());
  }

  // Update grid size
  updateGridSize(newSize: number): void {
    this.state.grid = {
      ...this.state.grid,
      gridSize: newSize
    };
    this.notify();
  }

  // Load pattern from data
  loadPattern(data: {
    symbols: Array<{ row: number; col: number; symbolType: string; color: string }>;
    rows: number;
    cols: number;
    gridSize: number;
  }): void {
    const symbolsMap = new Map<string, PatternSymbol>();
    
    data.symbols.forEach((symbolData, index) => {
      const symbol: PatternSymbol = {
        id: `loaded_symbol_${index}`,
        symbolType: symbolData.symbolType,
        color: symbolData.color,
        row: symbolData.row,
        col: symbolData.col
      };
      const key = this.getGridKey(symbol.row, symbol.col);
      symbolsMap.set(key, symbol);
    });

    this.state.grid = {
      symbols: symbolsMap,
      rows: data.rows,
      cols: data.cols,
      gridSize: data.gridSize
    };

    this.saveToHistory();
    this.notify();
  }

  // Export pattern data
  exportPattern(): {
    symbols: Array<{ row: number; col: number; symbolType: string; color: string }>;
    rows: number;
    cols: number;
    gridSize: number;
  } {
    const symbols = Array.from(this.state.grid.symbols.values()).map(symbol => ({
      row: symbol.row,
      col: symbol.col,
      symbolType: symbol.symbolType,
      color: symbol.color
    }));

    return {
      symbols,
      rows: this.state.grid.rows,
      cols: this.state.grid.cols,
      gridSize: this.state.grid.gridSize
    };
  }
}

// Create singleton instance for the application
export const patternDomain = new PatternDomain();