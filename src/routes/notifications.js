import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/notifications
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { owner_id: req.userId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(notifications);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/notifications/read-all  (mark all as read)
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { owner_id: req.userId, read: false },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/notifications/:id/read  (mark one as read)
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Notification not found" });

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/notifications/:id  (dismiss)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: { id: req.params.id, owner_id: req.userId },
    });
    if (!existing) return res.status(404).json({ error: "Notification not found" });

    await prisma.notification.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/notifications  (clear all)
router.delete("/", authenticate, async (req, res) => {
  try {
    await prisma.notification.deleteMany({ where: { owner_id: req.userId } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/notifications  (create — used internally or for testing)
router.post("/", authenticate, async (req, res) => {
  const { title, desc, type } = req.body;
  if (!title || !desc) return res.status(400).json({ error: "title and desc required" });
  try {
    const notif = await prisma.notification.create({
      data: { title, desc, type: type || "info", owner_id: req.userId },
    });
    return res.status(201).json(notif);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
