import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/profile
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, full_name: true, store_name: true, bio: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/profile
router.put("/", authenticate, async (req, res) => {
  const { full_name, store_name, bio } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(full_name  != null && { full_name:  full_name.trim()  }),
        ...(store_name != null && { store_name: store_name.trim() }),
        ...(bio        != null && { bio:        bio.trim()        }),
      },
      select: { id: true, email: true, full_name: true, store_name: true, bio: true },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/profile/password
router.put("/password", authenticate, async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  try {
    const hashed = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed },
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
