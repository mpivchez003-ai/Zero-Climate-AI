import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth } from "../lib/auth";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password, name } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, name }).returning();

  const token = signToken(user!.id);
  res.status(201).json({
    user: { id: user!.id, email: user!.email, name: user!.name, createdAt: user!.createdAt.toISOString() },
    token,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
    token,
  });
});

// POST /auth/logout
router.post("/auth/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res) => {
  const userId = (req as typeof req & { userId: number }).userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() });
});

export default router;
