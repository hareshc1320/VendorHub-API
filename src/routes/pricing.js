import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/pricing — public, no auth needed
router.get("/", async (_req, res) => {
  try {
    const plans = await prisma.pricingPlan.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
    });
    return res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features) })));
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/pricing/all — all plans including inactive (admin only)
router.get("/all", authenticate, async (_req, res) => {
  try {
    const plans = await prisma.pricingPlan.findMany({ orderBy: { sort_order: "asc" } });
    return res.json(plans.map(p => ({ ...p, features: JSON.parse(p.features) })));
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/pricing/:id — update plan (admin only)
router.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, price, yearly_price, description, badge, highlight, active, features } = req.body;

  try {
    const existing = await prisma.pricingPlan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Plan not found" });

    const updated = await prisma.pricingPlan.update({
      where: { id },
      data: {
        ...(name        !== undefined && { name }),
        ...(price       !== undefined && { price: parseFloat(price) }),
        ...(yearly_price !== undefined && { yearly_price: parseFloat(yearly_price) }),
        ...(description !== undefined && { description }),
        ...(badge       !== undefined && { badge }),
        ...(highlight   !== undefined && { highlight }),
        ...(active      !== undefined && { active }),
        ...(features    !== undefined && { features: JSON.stringify(features) }),
      },
    });

    return res.json({ ...updated, features: JSON.parse(updated.features) });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
