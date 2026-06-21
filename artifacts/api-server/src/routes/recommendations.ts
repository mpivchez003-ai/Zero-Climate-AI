import { Router } from "express";
import { db } from "@workspace/db";
import { carbonProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { generateRecommendations, type CarbonInputData, type CarbonResultData } from "../lib/carbonEngine";

const router = Router();

// GET /recommendations
router.get("/recommendations", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;

  const [profile] = await db.select().from(carbonProfilesTable).where(eq(carbonProfilesTable.userId, userId)).limit(1);

  if (!profile) {
    // Return generic recommendations for users without a profile
    res.json([
      {
        id: "complete-calculator",
        action: "Complete your carbon footprint calculator",
        description: "Fill in your travel, energy, food, and shopping details to get personalised recommendations based on your actual footprint.",
        estimatedKgCo2Reduction: 0,
        costImpact: 0,
        costDirection: "save",
        difficulty: "easy",
        category: "other",
        priority: 1,
      },
    ]);
    return;
  }

  const inputs = profile.inputs as CarbonInputData;
  const result = profile.result as CarbonResultData;
  const recs = generateRecommendations(inputs, result);
  res.json(recs);
});

export default router;
