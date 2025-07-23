import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatternSchema, updatePatternSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all patterns
  app.get("/api/patterns", async (req, res) => {
    try {
      const patterns = await storage.getAllPatterns();
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patterns" });
    }
  });

  // Get pattern by ID
  app.get("/api/patterns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pattern ID" });
      }

      const pattern = await storage.getPattern(id);
      if (!pattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }

      res.json(pattern);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pattern" });
    }
  });

  // Create new pattern
  app.post("/api/patterns", async (req, res) => {
    try {
      const validatedData = insertPatternSchema.parse(req.body);
      const pattern = await storage.createPattern(validatedData);
      res.status(201).json(pattern);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid pattern data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create pattern" });
    }
  });

  // Update pattern
  app.patch("/api/patterns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pattern ID" });
      }

      const validatedData = updatePatternSchema.parse(req.body);
      const pattern = await storage.updatePattern(id, validatedData);
      
      if (!pattern) {
        return res.status(404).json({ message: "Pattern not found" });
      }

      res.json(pattern);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid pattern data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update pattern" });
    }
  });

  // Delete pattern
  app.delete("/api/patterns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid pattern ID" });
      }

      const deleted = await storage.deletePattern(id);
      if (!deleted) {
        return res.status(404).json({ message: "Pattern not found" });
      }

      res.json({ message: "Pattern deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pattern" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
