import { pgTable, serial, integer, text, numeric, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetKgCo2Reduction: numeric("target_kg_co2_reduction", { precision: 10, scale: 2 }).notNull(),
  currentProgress: numeric("current_progress", { precision: 10, scale: 2 }).default("0").notNull(),
  category: text("category").notNull(),
  deadline: date("deadline").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, createdAt: true, currentProgress: true, completed: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goalsTable.$inferSelect;
