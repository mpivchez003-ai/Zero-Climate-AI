import { Router } from "express";
import { db } from "@workspace/db";
import { carbonProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { calculateCarbonFootprint, type CarbonInputData } from "../lib/carbonEngine";
import { z } from "zod";

const router = Router();

const carbonInputSchema = z.object({
  weeklyKmDriven: z.number().min(0),
  carType: z.enum(["petrol", "diesel", "ev", "none"]),
  monthlyKwh: z.number().min(0),
  energySourceMix: z.object({
    coal: z.number().min(0).max(100),
    gas: z.number().min(0).max(100),
    renewables: z.number().min(0).max(100),
  }),
  dietType: z.enum(["vegan", "vegetarian", "omnivore", "heavy_meat"]),
  flightsPerYear: z.number().int().min(0),
  flightType: z.enum(["short", "long", "mixed"]),
  monthlyShoppingSpend: z.number().min(0),
  region: z.string(),
});

// POST /carbon/calculate
router.post("/carbon/calculate", requireAuth, async (req, res) => {
  const parsed = carbonInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const result = calculateCarbonFootprint(parsed.data as CarbonInputData);
  res.json(result);
});

// GET /carbon/profile
router.get("/carbon/profile", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const [profile] = await db.select().from(carbonProfilesTable).where(eq(carbonProfilesTable.userId, userId)).limit(1);
  if (!profile) {
    res.status(404).json({ error: "No carbon profile found" });
    return;
  }
  res.json({
    id: profile.id,
    userId: profile.userId,
    inputs: profile.inputs,
    result: profile.result,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  });
});

// PUT /carbon/profile
router.put("/carbon/profile", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const parsed = carbonInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const inputs = parsed.data as CarbonInputData;
  const result = calculateCarbonFootprint(inputs);

  const existing = await db.select().from(carbonProfilesTable).where(eq(carbonProfilesTable.userId, userId)).limit(1);

  let profile;
  if (existing.length > 0) {
    [profile] = await db
      .update(carbonProfilesTable)
      .set({ inputs, result, updatedAt: new Date() })
      .where(eq(carbonProfilesTable.userId, userId))
      .returning();
  } else {
    [profile] = await db
      .insert(carbonProfilesTable)
      .values({ userId, inputs, result })
      .returning();
  }

  res.json({
    id: profile!.id,
    userId: profile!.userId,
    inputs: profile!.inputs,
    result: profile!.result,
    createdAt: profile!.createdAt.toISOString(),
    updatedAt: profile!.updatedAt.toISOString(),
  });
});

export default router;
