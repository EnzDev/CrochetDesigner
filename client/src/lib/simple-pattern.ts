// Simple, reliable pattern management without DDD complexity

export interface SimpleSymbol {
  row: number;
  col: number;
  symbol: string;
  color: string;
  width?: number; // For multi-cell symbols like 2dctog, 3dctog
  occupiedBy?: { row: number; col: number }; // For cells occupied by multi-cell symbols
  mirrored?: boolean; // For decrease stitches that can be mirrored
}

export interface SimplePattern {
  symbols: SimpleSymbol[];
  rows: number;
  cols: number;
  gridSize: number;
  startCol: number; // Starting column offset (can be negative)
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
      gridSize,
      startCol: 0 // Start at column 0
    };
    this.saveToHistory();
  }

  // Get current pattern state
  getPattern(): SimplePattern {
    return { ...this.pattern, symbols: [...this.pattern.symbols] };
  }

  // Place a symbol
  placeSymbol(row: number, col: number, symbol: string, color: string, mirrored: boolean = false): void {
    // Get symbol width for multi-cell symbols
    const getSymbolWidth = (symbolId: string): number => {
      switch (symbolId) {
        case '2dctog': return 2;
        case '3dctog': return 3;
        default: return 1;
      }
    };
    
    const symbolWidth = getSymbolWidth(symbol);
    let actualCol = col;
    
    // For normal (non-mirrored) decrease stitches, adjust placement to span left
    if ((symbol === '2dctog' || symbol === '3dctog') && !mirrored) {
      // Place the symbol so that the DC (rightmost part) is at the clicked position
      // This means the symbol actually starts further left
      actualCol = col - (symbolWidth - 1);
    }
    
    // Ensure grid is large enough
    if (row >= this.pattern.rows) this.pattern.rows = row + 1;
    if (actualCol + symbolWidth > this.pattern.cols) this.pattern.cols = actualCol + symbolWidth;
    if (actualCol < 0) {
      // Handle negative columns by expanding left
      const expansion = Math.abs(actualCol);
      this.pattern.startCol -= expansion;
      this.pattern.cols += expansion;
      actualCol = 0;
      
      // Shift all existing symbols right
      this.pattern.symbols.forEach(s => {
        s.col += expansion;
        if (s.occupiedBy) {
          s.occupiedBy.col += expansion;
        }
      });
    }
    
    // Remove any existing symbols in the range this symbol will occupy
    for (let i = 0; i < symbolWidth; i++) {
      this.pattern.symbols = this.pattern.symbols.filter(s => 
        !(s.row === row && s.col === actualCol + i)
      );
    }
    
    // Also remove any symbols that this position might be occupied by
    this.pattern.symbols = this.pattern.symbols.filter(s => {
      if (s.occupiedBy && s.occupiedBy.row === row && s.occupiedBy.col <= actualCol && actualCol < s.occupiedBy.col + (s.width || 1)) {
        return false; // Remove the occupied cell
      }
      return true;
    });

    // Add the main symbol
    const symbolData: SimpleSymbol = { row, col: actualCol, symbol, color, width: symbolWidth };
    if (mirrored && (symbol === '2dctog' || symbol === '3dctog')) {
      symbolData.mirrored = true;
    }
    this.pattern.symbols.push(symbolData);
    
    // Add occupied markers for multi-cell symbols
    for (let i = 1; i < symbolWidth; i++) {
      this.pattern.symbols.push({ 
        row, 
        col: actualCol + i, 
        symbol: 'occupied', 
        color, 
        occupiedBy: { row, col: actualCol } 
      });
    }
  }

  // Remove a symbol
  removeSymbol(row: number, col: number): boolean {
    const initialLength = this.pattern.symbols.length;
    
    // Find if this position is occupied by a multi-cell symbol
    const occupiedSymbol = this.pattern.symbols.find(s => 
      s.occupiedBy && s.occupiedBy.row === row && s.occupiedBy.col <= col && 
      col < s.occupiedBy.col + (this.getSymbolAt(s.occupiedBy.row, s.occupiedBy.col)?.width || 1)
    );
    
    if (occupiedSymbol && occupiedSymbol.occupiedBy) {
      // Remove the main symbol and all its occupied cells
      const mainSymbol = this.getSymbolAt(occupiedSymbol.occupiedBy.row, occupiedSymbol.occupiedBy.col);
      if (mainSymbol) {
        const symbolWidth = mainSymbol.width || 1;
        for (let i = 0; i < symbolWidth; i++) {
          this.pattern.symbols = this.pattern.symbols.filter(s => 
            !(s.row === occupiedSymbol.occupiedBy!.row && s.col === occupiedSymbol.occupiedBy!.col + i)
          );
        }
      }
    } else {
      // Remove the symbol at this position and any occupied cells it controls
      const symbolAtPos = this.getSymbolAt(row, col);
      if (symbolAtPos && symbolAtPos.width && symbolAtPos.width > 1) {
        // Multi-cell symbol - remove all occupied cells
        for (let i = 0; i < symbolAtPos.width; i++) {
          this.pattern.symbols = this.pattern.symbols.filter(s => 
            !(s.row === row && s.col === col + i)
          );
        }
      } else {
        // Single cell symbol
        this.pattern.symbols = this.pattern.symbols.filter(s => 
          !(s.row === row && s.col === col)
        );
      }
    }

    return this.pattern.symbols.length < initialLength;
  }
  
  // Helper method to get symbol at position
  private getSymbolAt(row: number, col: number): SimpleSymbol | undefined {
    return this.pattern.symbols.find(s => s.row === row && s.col === col);
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
    this.saveToHistory();
  }

  // Add column to the left (shift existing symbols right)
  addColumnLeft(): void {
    // Shift all existing symbols one column to the right
    this.pattern.symbols.forEach(symbol => {
      symbol.col += 1;
      if (symbol.occupiedBy) {
        symbol.occupiedBy.col += 1;
      }
    });
    // Decrease starting column to maintain grid numbering
    this.pattern.startCol--;
    this.pattern.cols++;
    this.saveToHistory();
  }

  removeColumnRight(): boolean {
    if (this.pattern.cols <= 1) return false;
    
    // Remove symbols from rightmost column
    this.pattern.symbols = this.pattern.symbols.filter(s => s.col !== this.pattern.cols - 1);
    
    this.pattern.cols--;
    return true;
  }

  // Remove column from the left (shift existing symbols left)
  removeColumnLeft(): boolean {
    if (this.pattern.cols <= 1) return false;
    
    // Remove symbols from leftmost column (column 0)
    this.pattern.symbols = this.pattern.symbols.filter(s => s.col !== 0);
    
    // Shift remaining symbols one column to the left
    this.pattern.symbols.forEach(symbol => {
      symbol.col -= 1;
      if (symbol.occupiedBy) {
        symbol.occupiedBy.col -= 1;
      }
    });
    
    // Increase starting column to maintain grid numbering
    this.pattern.startCol++;
    this.pattern.cols--;
    this.saveToHistory();
    return true;
  }

  // Change color of symbols in a selection area
  changeSelectionColor(startRow: number, startCol: number, endRow: number, endCol: number, newColor: string): void {
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    // Update color for all symbols in the selection area
    this.pattern.symbols.forEach(symbol => {
      // Skip occupied markers - only change actual symbols
      if (symbol.symbol === 'occupied') return;
      
      if (symbol.row >= minRow && symbol.row <= maxRow && 
          symbol.col >= minCol && symbol.col <= maxCol) {
        symbol.color = newColor;
      }
    });
    
    this.saveToHistory();
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
      gridSize: this.pattern.gridSize,
      startCol: 0
    };
  }

  // Clear entire pattern (alias for clear)
  clearPattern(): void {
    this.clear();
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
      gridSize: this.pattern.gridSize,
      startCol: this.pattern.startCol
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
        gridSize: this.history[this.historyIndex].gridSize,
        startCol: this.history[this.historyIndex].startCol
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
        gridSize: this.history[this.historyIndex].gridSize,
        startCol: this.history[this.historyIndex].startCol
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
  loadPattern(data: { symbols: SimpleSymbol[]; rows: number; cols: number; gridSize: number; startCol?: number }): void {
    // Process symbols to rebuild occupied markers for multi-cell symbols
    const processedSymbols: SimpleSymbol[] = [];
    
    data.symbols.forEach(symbol => {
      // Only process actual symbols, skip occupied markers from saved data
      if (symbol.symbol === 'occupied') return;
      
      // Add the main symbol
      processedSymbols.push({...symbol});
      
      // Add occupied markers for multi-cell symbols
      const symbolWidth = symbol.width || 1;
      for (let i = 1; i < symbolWidth; i++) {
        processedSymbols.push({ 
          row: symbol.row, 
          col: symbol.col + i, 
          symbol: 'occupied', 
          color: symbol.color, 
          occupiedBy: { row: symbol.row, col: symbol.col } 
        });
      }
    });
    
    this.pattern = {
      symbols: processedSymbols,
      rows: data.rows,
      cols: data.cols,
      gridSize: data.gridSize,
      startCol: data.startCol || 0
    };
    this.saveToHistory();
  }

  // Export pattern
  exportPattern(): { symbols: SimpleSymbol[]; rows: number; cols: number; gridSize: number; startCol: number } {
    return {
      symbols: [...this.pattern.symbols],
      rows: this.pattern.rows,
      cols: this.pattern.cols,
      gridSize: this.pattern.gridSize,
      startCol: this.pattern.startCol
    };
  }
}

// Global instance
export const simplePattern = new SimplePatternManager();