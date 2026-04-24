import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes          from "./routes/auth.js";
import productsRoutes      from "./routes/products.js";
import customersRoutes     from "./routes/customers.js";
import ordersRoutes        from "./routes/orders.js";
import dashboardRoutes     from "./routes/dashboard.js";
import profileRoutes       from "./routes/profile.js";
import notificationsRoutes from "./routes/notifications.js";
import pricingRoutes       from "./routes/pricing.js";
import reviewsRoutes       from "./routes/reviews.js";
import uploadRoutes        from "./routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth",          authRoutes);
app.use("/api/products",      productsRoutes);
app.use("/api/customers",     customersRoutes);
app.use("/api/orders",        ordersRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/profile",       profileRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/pricing",       pricingRoutes);
app.use("/api/reviews",       reviewsRoutes);
app.use("/api/upload",        uploadRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(PORT, () => {
  console.log(`\n🚀 VendorHub API running at http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
