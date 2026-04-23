import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/products
router.get("/", authenticate, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { owner_id: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(products);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/products
router.post("/", authenticate, async (req, res) => {
  const { name, price, stock, category, description } = req.body;
  if (!name || price == null || !category) {
    return res.status(400).json({ error: "name, price and category are required" });
  }
  try {
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        stock: parseInt(stock ?? 0),
        category,
        description: description?.trim() || null,
        owner_id: req.userId,
      },
    });
    return res.status(201).json(product);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/products/:id
router.put("/:id", authenticate, async (req, res) => {
  const { name, price, stock, category, description } = req.body;
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Product not found" });

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name != null      && { name: name.trim() }),
        ...(price != null     && { price: parseFloat(price) }),
        ...(stock != null     && { stock: parseInt(stock) }),
        ...(category != null  && { category }),
        ...(description != null && { description: description.trim() || null }),
      },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/products/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Product not found" });

    await prisma.product.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
