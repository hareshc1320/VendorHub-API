import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/reviews
router.get("/", authenticate, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { owner_id: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(reviews);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/reviews
router.post("/", authenticate, async (req, res) => {
  const { customer_name, product_name, rating, comment, status } = req.body;
  if (!customer_name || !product_name || !rating) {
    return res.status(400).json({ error: "customer_name, product_name and rating are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  try {
    const review = await prisma.review.create({
      data: {
        customer_name,
        product_name,
        rating: Number(rating),
        comment: comment || null,
        status: status || "published",
        owner_id: req.userId,
      },
    });
    return res.status(201).json(review);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/reviews/:id
router.put("/:id", authenticate, async (req, res) => {
  const { status, comment } = req.body;
  try {
    const existing = await prisma.review.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Review not found" });

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        ...(status  != null && { status  }),
        ...(comment != null && { comment }),
      },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/reviews/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.review.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Review not found" });

    await prisma.review.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
