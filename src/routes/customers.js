import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/customers
router.get("/", authenticate, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { owner_id: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(customers);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/customers
router.post("/", authenticate, async (req, res) => {
  const { name, email, phone, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }
  try {
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        status: status || "active",
        owner_id: req.userId,
      },
    });
    return res.status(201).json(customer);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/customers/:id
router.put("/:id", authenticate, async (req, res) => {
  const { name, email, phone, status, orders_count, total_spent } = req.body;
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...(name         != null && { name: name.trim() }),
        ...(email        != null && { email: email.trim().toLowerCase() }),
        ...(phone        != null && { phone: phone.trim() || null }),
        ...(status       != null && { status }),
        ...(orders_count != null && { orders_count: parseInt(orders_count) }),
        ...(total_spent  != null && { total_spent: parseFloat(total_spent) }),
      },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/customers/:id
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    await prisma.customer.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
