import { Router } from "express";
import { db } from "@workspace/db";
import { carbonProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { simulateScenario, type CarbonInputData } from "../lib/carbonEngine";
import { z } from "zod";

const router = Router();

const simulationInputSchema = z.object({
  publicTransportAdoptionPct: z.number().min(0).max(100),
  renewableEnergyPct: z.number().min(0).max(100),
  dietShift: z.enum(["none", "vegetarian", "vegan"]),
  flightReductionPct: z.number().min(0).max(100),
});

// POST /simulate
router.post("/simulate", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;

  const parsed = simulationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [profile] = await db.select().from(carbonProfilesTable).where(eq(carbonProfilesTable.userId, userId)).limit(1);

  if (!profile) {
    // Use default average profile if user has no profile
    const defaultInputs: CarbonInputData = {
      weeklyKmDriven: 150,
      carType: "petrol",
      monthlyKwh: 300,
      energySourceMix: { coal: 30, gas: 40, renewables: 30 },
      dietType: "omnivore",
      flightsPerYear: 2,
      flightType: "short",
      monthlyShoppingSpend: 150,
      region: "global",
    };

    const { currentResult, projectedResult } = simulateScenario(defaultInputs, parsed.data);
    const delta = currentResult.totalAnnualKgCo2 - projectedResult.totalAnnualKgCo2;
    const pctReduction = delta / currentResult.totalAnnualKgCo2 * 100;

    res.json({
      currentAnnualKgCo2: currentResult.totalAnnualKgCo2,
      projectedAnnualKgCo2: projectedResult.totalAnnualKgCo2,
      deltaKgCo2: Math.round(delta * 10) / 10,
      percentageReduction: Math.round(pctReduction * 10) / 10,
      treesEquivalent: Math.round(delta / 21.77), // 1 tree absorbs ~21.77 kg CO2/year (EPA)
      carFreeDays: Math.round(delta / (0.192 * 30)), // avg petrol car @ 30 km/day
      explanation: buildExplanation(parsed.data, pctReduction, delta),
      breakdown: currentResult.breakdown,
      projectedBreakdown: projectedResult.breakdown,
    });
    return;
  }

  const inputs = profile.inputs as CarbonInputData;
  const { currentResult, projectedResult } = simulateScenario(inputs, parsed.data);
  const delta = currentResult.totalAnnualKgCo2 - projectedResult.totalAnnualKgCo2;
  const pctReduction = currentResult.totalAnnualKgCo2 > 0 ? (delta / currentResult.totalAnnualKgCo2) * 100 : 0;

  res.json({
    currentAnnualKgCo2: currentResult.totalAnnualKgCo2,
    projectedAnnualKgCo2: projectedResult.totalAnnualKgCo2,
    deltaKgCo2: Math.round(delta * 10) / 10,
    percentageReduction: Math.round(pctReduction * 10) / 10,
    treesEquivalent: Math.round(Math.max(0, delta) / 21.77),
    carFreeDays: Math.round(Math.max(0, delta) / (0.192 * 30)),
    explanation: buildExplanation(parsed.data, pctReduction, delta),
    breakdown: currentResult.breakdown,
    projectedBreakdown: projectedResult.breakdown,
  });
});

function buildExplanation(
  scenario: { publicTransportAdoptionPct: number; renewableEnergyPct: number; dietShift: string; flightReductionPct: number },
  pctReduction: number,
  deltaKg: number
): string {
  const changes: string[] = [];
  if (scenario.publicTransportAdoptionPct > 0)
    changes.push(`${scenario.publicTransportAdoptionPct}% public transport adoption`);
  if (scenario.renewableEnergyPct > 0)
    changes.push(`${scenario.renewableEnergyPct}% renewable energy`);
  if (scenario.dietShift !== "none")
    changes.push(`switching to a ${scenario.dietShift} diet`);
  if (scenario.flightReductionPct > 0)
    changes.push(`${scenario.flightReductionPct}% fewer flights`);

  const changeStr = changes.length > 0 ? changes.join(", ") : "no behavioural changes";
  const direction = deltaKg >= 0 ? "reduce" : "increase";
  const absDelta = Math.abs(Math.round(deltaKg));
  const absPct = Math.abs(Math.round(pctReduction * 10) / 10);

  return `This scenario — ${changeStr} — would ${direction} your annual footprint by ${absDelta} kg CO₂e (${absPct}%). That is equivalent to ${Math.round(Math.max(0, deltaKg) / 21.77)} trees absorbing carbon for a full year.`;
}

export default router;
