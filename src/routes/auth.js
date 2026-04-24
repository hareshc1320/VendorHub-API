import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, full_name: full_name || null },
    });
    const token = signToken(user.id);
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken(user.id);
    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, avatar: user.avatar },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/google
router.post("/google", async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: "access_token required" });

  try {
    // Verify token with Google and get user info
    const gRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!gRes.ok) return res.status(401).json({ error: "Invalid Google token" });

    const { sub: google_id, email, name, picture } = await gRes.json();
    if (!email) return res.status(401).json({ error: "Could not get email from Google" });

    // Find existing user by google_id or email, or create new
    let user = await prisma.user.findFirst({
      where: { OR: [{ google_id }, { email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email, full_name: name, google_id, avatar: picture },
      });
    } else if (!user.google_id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { google_id, avatar: picture || user.avatar },
      });
    }

    const token = signToken(user.id);
    return res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, avatar: user.avatar },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
