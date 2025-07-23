import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  hookSize: text("hook_size").notNull(),
  yarnWeight: text("yarn_weight").notNull(),
  gauge: text("gauge"),
  difficulty: text("difficulty").notNull(),
  notes: text("notes"),
  materials: jsonb("materials").$type<string[] | null>(),
  canvasData: text("canvas_data").notNull(), // Base64 encoded canvas data
  patternData: jsonb("pattern_data").$type<any>(), // Pattern elements and metadata
  gridSize: integer("grid_size").notNull().default(20),
  canvasWidth: integer("canvas_width").notNull().default(800),
  canvasHeight: integer("canvas_height").notNull().default(600),
});

export const insertPatternSchema = createInsertSchema(patterns).omit({
  id: true,
});

export const updatePatternSchema = insertPatternSchema.partial();

export type Pattern = typeof patterns.$inferSelect;
export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type UpdatePattern = z.infer<typeof updatePatternSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
