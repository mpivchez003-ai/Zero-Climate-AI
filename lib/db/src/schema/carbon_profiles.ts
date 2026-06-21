import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carbonProfilesTable = pgTable("carbon_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  inputs: jsonb("inputs").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCarbonProfileSchema = createInsertSchema(carbonProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarbonProfile = z.infer<typeof insertCarbonProfileSchema>;
export type CarbonProfile = typeof carbonProfilesTable.$inferSelect;
