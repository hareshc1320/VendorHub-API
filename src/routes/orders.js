import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

function genOrderNumber() {
  return "ORD-" + Math.floor(1000 + Math.random() * 9000);
}

// GET /api/orders
router.get("/", authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { owner_id: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/orders
router.post("/", authenticate, async (req, res) => {
  const { customer_name, total, items_count, status } = req.body;
  if (!customer_name || total == null) {
    return res.status(400).json({ error: "customer_name and total are required" });
  }
  try {
    const order = await prisma.order.create({
      data: {
        order_number: genOrderNumber(),
        customer_name: customer_name.trim(),
        total: parseFloat(total),
        items_count: parseInt(items_count ?? 1),
        status: status || "processing",
        owner_id: req.userId,
      },
    });
    return res.status(201).json(order);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/orders/:id  (update status or any field)
router.put("/:id", authenticate, async (req, res) => {
  const { status, customer_name, total, items_count } = req.body;
  try {
    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Order not found" });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        ...(status        != null && { status }),
        ...(customer_name != null && { customer_name: customer_name.trim() }),
        ...(total         != null && { total: parseFloat(total) }),
        ...(items_count   != null && { items_count: parseInt(items_count) }),
      },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/orders/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.order.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Order not found" });

    await prisma.order.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
