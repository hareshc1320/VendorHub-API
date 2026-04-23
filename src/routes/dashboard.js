import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/stats
router.get("/stats", authenticate, async (req, res) => {
  try {
    const [products, customers, orders] = await Promise.all([
      prisma.product.findMany({ where: { owner_id: req.userId } }),
      prisma.customer.findMany({ where: { owner_id: req.userId } }),
      prisma.order.findMany({ where: { owner_id: req.userId } }),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    const pendingOrders = orders.filter((o) => o.status === "processing").length;

    return res.json({
      productCount:  products.length,
      customerCount: customers.length,
      orderCount:    orders.length,
      totalRevenue,
      pendingOrders,
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/dashboard/revenue?period=7D|1M|3M|1Y
router.get("/revenue", authenticate, async (req, res) => {
  const period = req.query.period || "1Y";
  const now = new Date();

  try {
    const orders = await prisma.order.findMany({
      where: {
        owner_id: req.userId,
        status: { in: ["delivered", "shipped"] },
      },
      orderBy: { createdAt: "asc" },
    });

    let data = [];

    if (period === "7D") {
      // Last 7 days grouped by day name
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const map = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = days[d.getDay()];
        map[key] = { name: key, revenue: 0, orders: 0 };
      }
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const diff = Math.floor((now - d) / 86400000);
        if (diff <= 6) {
          const key = days[d.getDay()];
          if (map[key]) {
            map[key].revenue += o.total;
            map[key].orders += 1;
          }
        }
      });
      data = Object.values(map);

    } else if (period === "1M") {
      // Last 4 weeks
      data = [
        { name: "W1", revenue: 0, orders: 0 },
        { name: "W2", revenue: 0, orders: 0 },
        { name: "W3", revenue: 0, orders: 0 },
        { name: "W4", revenue: 0, orders: 0 },
      ];
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const diff = Math.floor((now - d) / 86400000);
        if (diff <= 28) {
          const week = Math.min(3, Math.floor(diff / 7));
          const idx = 3 - week;
          data[idx].revenue += o.total;
          data[idx].orders  += 1;
        }
      });

    } else if (period === "3M") {
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const map = {};
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthNames[d.getMonth()];
        map[key] = { name: key, revenue: 0, orders: 0 };
      }
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const diff =
          (now.getFullYear() - d.getFullYear()) * 12 +
          (now.getMonth() - d.getMonth());
        if (diff <= 2) {
          const key = monthNames[d.getMonth()];
          if (map[key]) {
            map[key].revenue += o.total;
            map[key].orders  += 1;
          }
        }
      });
      data = Object.values(map);

    } else {
      // 1Y — last 12 months
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const map = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthNames[d.getMonth()];
        map[key] = { name: key, revenue: 0, orders: 0 };
      }
      orders.forEach((o) => {
        const d = new Date(o.createdAt);
        const diff =
          (now.getFullYear() - d.getFullYear()) * 12 +
          (now.getMonth() - d.getMonth());
        if (diff <= 11) {
          const key = monthNames[d.getMonth()];
          if (map[key]) {
            map[key].revenue += o.total;
            map[key].orders  += 1;
          }
        }
      });
      data = Object.values(map);
    }

    return res.json(data);
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/dashboard/reports
router.get("/reports", authenticate, async (req, res) => {
  try {
    const [products, customers, orders] = await Promise.all([
      prisma.product.findMany({ where: { owner_id: req.userId } }),
      prisma.customer.findMany({ where: { owner_id: req.userId } }),
      prisma.order.findMany({ where: { owner_id: req.userId } }),
    ]);

    // KPIs
    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);
    const totalOrders   = orders.length;
    const newCustomers  = customers.length;
    const productsSold  = orders.reduce((sum, o) => sum + o.items_count, 0);

    // Monthly revenue (last 6 months)
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();
    const monthlyMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthNames[d.getMonth()];
      monthlyMap[key] = { month: key, revenue: 0 };
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const diff =
        (now.getFullYear() - d.getFullYear()) * 12 +
        (now.getMonth() - d.getMonth());
      if (diff <= 5) {
        const key = monthNames[d.getMonth()];
        if (monthlyMap[key]) monthlyMap[key].revenue += o.total;
      }
    });
    const monthlyRevenue = Object.values(monthlyMap);

    // Category breakdown from products
    const catMap = {};
    products.forEach((p) => {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
    });
    const total = products.length || 1;
    const categoryData = Object.entries(catMap)
      .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }))
      .sort((a, b) => b.value - a.value);

    // Performance metrics
    const avgOrderValue = totalOrders
      ? +(totalRevenue / totalOrders).toFixed(2)
      : 0;

    const deliveredCount = orders.filter((o) => o.status === "delivered").length;
    const conversionRate = totalOrders
      ? +((deliveredCount / totalOrders) * 100).toFixed(1)
      : 0;

    const vipCustomers = customers.filter((c) => c.status === "vip").length;
    const retention = customers.length
      ? +((vipCustomers / customers.length) * 100).toFixed(1)
      : 0;

    const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
    const returnRate = totalOrders
      ? +((cancelledCount / totalOrders) * 100).toFixed(1)
      : 0;

    return res.json({
      kpis: {
        totalRevenue,
        totalOrders,
        newCustomers,
        productsSold,
      },
      monthlyRevenue,
      categoryData,
      performance: {
        avgOrderValue,
        conversionRate,
        retention,
        returnRate,
      },
    });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
