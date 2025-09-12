import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url"; // Needed for ES modules (__dirname)
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import connectDB from "./lib/db.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Convert import.meta.url to __dirname equivalent for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// CORS middleware for development: allow frontend dev server to access API with credentials
app.use((req, res, next) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Serve static files depending on environment
if (process.env.NODE_ENV === "production") {
  // In production, serve the built frontend
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
} else {
  // In development, serve static assets from public folder
  app.use(express.static(path.join(__dirname, "../public")));
}

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' https://js.stripe.com; " +
      "frame-src 'self' https://js.stripe.com; " +
      "connect-src 'self' https://api.stripe.com https://m.stripe.network; " +
      "img-src 'self' data: https://*.stripe.com; " +
      "style-src 'self' 'unsafe-inline';"
  );
  next();
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Fallback to index.html for client-side routing
app.get("*", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  }
  return res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});
