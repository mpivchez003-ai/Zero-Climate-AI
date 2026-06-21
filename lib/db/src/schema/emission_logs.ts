import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emissionLogsTable = pgTable("emission_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalKgCo2: numeric("total_kg_co2", { precision: 10, scale: 2 }).notNull(),
  score: integer("score").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmissionLogSchema = createInsertSchema(emissionLogsTable).omit({ id: true, createdAt: true });
export type InsertEmissionLog = z.infer<typeof insertEmissionLogSchema>;
export type EmissionLog = typeof emissionLogsTable.$inferSelect;
