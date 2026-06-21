import { Router } from "express";
import { db } from "@workspace/db";
import { goalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { z } from "zod";

const router = Router();

const goalInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  targetKgCo2Reduction: z.number().positive(),
  category: z.enum(["transportation", "electricity", "food", "shopping", "other"]),
  deadline: z.string(),
});

const goalUpdateSchema = z.object({
  currentProgress: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});

function formatGoal(g: typeof goalsTable.$inferSelect) {
  return {
    id: g.id,
    userId: g.userId,
    title: g.title,
    description: g.description ?? null,
    targetKgCo2Reduction: Number(g.targetKgCo2Reduction),
    currentProgress: Number(g.currentProgress),
    category: g.category,
    deadline: g.deadline,
    completed: g.completed,
    createdAt: g.createdAt.toISOString(),
  };
}

// GET /goals
router.get("/goals", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const goals = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
  res.json(goals.map(formatGoal));
});

// POST /goals
router.post("/goals", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = goalInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { title, description, targetKgCo2Reduction, category, deadline } = parsed.data;
  const [goal] = await db
    .insert(goalsTable)
    .values({ userId, title, description, targetKgCo2Reduction: String(targetKgCo2Reduction), category, deadline })
    .returning();
  res.status(201).json(formatGoal(goal!));
});

// PATCH /goals/:id
router.patch("/goals/:id", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const id = Number(req.params["id"]);
  const parsed = goalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const updateData: Partial<typeof goalsTable.$inferInsert> = {};
  if (parsed.data.currentProgress !== undefined) {
    updateData.currentProgress = String(parsed.data.currentProgress);
  }
  if (parsed.data.completed !== undefined) {
    updateData.completed = parsed.data.completed;
  }

  const [goal] = await db
    .update(goalsTable)
    .set(updateData)
    .where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)))
    .returning();

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  res.json(formatGoal(goal));
});

// DELETE /goals/:id
router.delete("/goals/:id", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const id = Number(req.params["id"]);
  await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
  res.json({ message: "Goal deleted" });
});

export default router;
