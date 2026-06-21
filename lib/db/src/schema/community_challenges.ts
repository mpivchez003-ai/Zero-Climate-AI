import { pgTable, serial, text, integer, numeric, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityChallengesTable = pgTable("community_challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  participantCount: integer("participant_count").default(0).notNull(),
  targetKgCo2: numeric("target_kg_co2", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  endDate: date("end_date").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunityChallengeSchema = createInsertSchema(communityChallengesTable).omit({ id: true, createdAt: true });
export type InsertCommunityChallenge = z.infer<typeof insertCommunityChallengeSchema>;
export type CommunityChallenge = typeof communityChallengesTable.$inferSelect;
