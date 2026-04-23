import express from "express";
import cors from "cors";
import authRoutes          from "./routes/auth.js";
import productsRoutes      from "./routes/products.js";
import customersRoutes     from "./routes/customers.js";
import ordersRoutes        from "./routes/orders.js";
import dashboardRoutes     from "./routes/dashboard.js";
import profileRoutes       from "./routes/profile.js";
import notificationsRoutes from "./routes/notifications.js";
import pricingRoutes       from "./routes/pricing.js";

const app  = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth",          authRoutes);
app.use("/api/products",      productsRoutes);
app.use("/api/customers",     customersRoutes);
app.use("/api/orders",        ordersRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/profile",       profileRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/pricing",       pricingRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(PORT, () => {
  console.log(`\n🚀 VendorHub API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
