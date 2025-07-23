// IndexedDB storage for offline crochet pattern data
export interface PatternData {
  id?: number;
  title: string;
  description?: string;
  hookSize?: string;
  yarnWeight?: string;
  difficulty?: string;
  canvasData?: string; // base64 encoded canvas image
  patternElements?: any; // JSONB-like data
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  canvasRows: number;
  canvasCols: number;
  gridSymbols: Record<string, { symbol: string; color: string }>; // serialized symbol map
  createdAt?: Date;
  updatedAt?: Date;
}

class IndexedDBStorage {
  private dbName = 'CrochetPatternDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create patterns store
        if (!db.objectStoreNames.contains('patterns')) {
          const store = db.createObjectStore('patterns', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async savePattern(pattern: Omit<PatternData, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date();
    const patternWithTimestamps: PatternData = {
      ...pattern,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readwrite');
      const store = transaction.objectStore('patterns');
      const request = store.add(patternWithTimestamps);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePattern(id: number, pattern: Partial<PatternData>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existingPattern = await this.getPattern(id);
    if (!existingPattern) throw new Error('Pattern not found');

    const updatedPattern: PatternData = {
      ...existingPattern,
      ...pattern,
      id,
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readwrite');
      const store = transaction.objectStore('patterns');
      const request = store.put(updatedPattern);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPattern(id: number): Promise<PatternData | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readonly');
      const store = transaction.objectStore('patterns');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPatterns(): Promise<PatternData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readonly');
      const store = transaction.objectStore('patterns');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePattern(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readwrite');
      const store = transaction.objectStore('patterns');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllPatterns(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['patterns'], 'readwrite');
      const store = transaction.objectStore('patterns');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage();