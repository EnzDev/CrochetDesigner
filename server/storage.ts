import { users, patterns, type User, type InsertUser, type Pattern, type InsertPattern, type UpdatePattern } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pattern management
  getPattern(id: number): Promise<Pattern | undefined>;
  getAllPatterns(): Promise<Pattern[]>;
  createPattern(pattern: InsertPattern): Promise<Pattern>;
  updatePattern(id: number, pattern: UpdatePattern): Promise<Pattern | undefined>;
  deletePattern(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patterns: Map<number, Pattern>;
  private currentUserId: number;
  private currentPatternId: number;

  constructor() {
    this.users = new Map();
    this.patterns = new Map();
    this.currentUserId = 1;
    this.currentPatternId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getPattern(id: number): Promise<Pattern | undefined> {
    return this.patterns.get(id);
  }

  async getAllPatterns(): Promise<Pattern[]> {
    return Array.from(this.patterns.values());
  }

  async createPattern(insertPattern: InsertPattern): Promise<Pattern> {
    const id = this.currentPatternId++;
    const pattern: Pattern = { 
      ...insertPattern, 
      id,
      materials: insertPattern.materials || null,
      patternData: insertPattern.patternData || {},
      gridSize: insertPattern.gridSize || 20,
      canvasWidth: insertPattern.canvasWidth || 800,
      canvasHeight: insertPattern.canvasHeight || 600,
    };
    this.patterns.set(id, pattern);
    return pattern;
  }

  async updatePattern(id: number, updatePattern: UpdatePattern): Promise<Pattern | undefined> {
    const existingPattern = this.patterns.get(id);
    if (!existingPattern) {
      return undefined;
    }
    
    const updatedPattern: Pattern = { 
      ...existingPattern, 
      ...updatePattern,
      materials: updatePattern.materials !== undefined ? updatePattern.materials : existingPattern.materials
    };
    this.patterns.set(id, updatedPattern);
    return updatedPattern;
  }

  async deletePattern(id: number): Promise<boolean> {
    return this.patterns.delete(id);
  }
}

export const storage = new MemStorage();
