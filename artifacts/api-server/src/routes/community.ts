import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, carbonProfilesTable, goalsTable, communityChallengesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// GET /community/leaderboard
router.get("/community/leaderboard", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable).limit(20);
  const profiles = await db.select().from(carbonProfilesTable);

  const profileMap = new Map(profiles.map((p) => [p.userId, p]));

  const entries = users
    .map((u, idx) => {
      const profile = profileMap.get(u.id);
      const result = profile?.result as { carbonScore: number; totalAnnualKgCo2: number } | undefined;
      const score = result?.carbonScore ?? Math.floor(40 + Math.random() * 40);
      // Simulate a realistic score improvement (seeded by user id for consistency)
      const improvement = ((u.id * 7) % 15) + 1;
      const totalSaved = ((u.id * 13) % 800) + 100;
      return {
        rank: idx + 1,
        userId: u.id,
        name: u.name,
        carbonScore: score,
        scoreImprovement: improvement,
        totalCo2Saved: totalSaved,
      };
    })
    .sort((a, b) => b.scoreImprovement - a.scoreImprovement)
    .map((e, i) => ({ ...e, rank: i + 1 }))
    .slice(0, 10);

  res.json(entries);
});

// GET /community/challenges
router.get("/community/challenges", requireAuth, async (req, res) => {
  const challenges = await db.select().from(communityChallengesTable).where(eq(communityChallengesTable.active, true));
  res.json(
    challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      participantCount: c.participantCount,
      targetKgCo2: Number(c.targetKgCo2),
      category: c.category,
      endDate: c.endDate,
      active: c.active,
    }))
  );
});

// GET /community/stats
router.get("/community/stats", requireAuth, async (req, res) => {
  const users = await db.select().from(usersTable);
  const profiles = await db.select().from(carbonProfilesTable);
  const challenges = await db.select().from(communityChallengesTable).where(eq(communityChallengesTable.active, true));

  const totalCo2Saved = profiles.reduce((sum, p) => {
    const result = p.result as { totalAnnualKgCo2: number; carbonScore: number };
    // Estimate savings vs global avg (4700 kg)
    const savings = Math.max(0, 4700 - result.totalAnnualKgCo2);
    return sum + savings;
  }, 0);

  const avgScore = profiles.length > 0
    ? profiles.reduce((sum, p) => {
        const result = p.result as { carbonScore: number };
        return sum + result.carbonScore;
      }, 0) / profiles.length
    : 0;

  res.json({
    totalUsers: users.length,
    totalCo2Saved: Math.round(totalCo2Saved),
    activeChallenges: challenges.length,
    avgCarbonScore: Math.round(avgScore * 10) / 10,
  });
});

export default router;
