import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
// Clerk middleware is imported dynamically later after we verify environment variables
import path from "path";
import { fileURLToPath } from "url"; // Needed for ES modules (__dirname)
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import adminRoutes from "./routes/admin.route.js";
import orderRoutes from "./routes/order.route.js";
import feedbackRoutes from "./routes/feedback.route.js";
import aiRoutes from "./routes/ai.route.js";
import connectDB from "./lib/db.js";

dotenv.config();
connectDB();

// Debug: print effective CLIENT_URL so developers can confirm the backend will
// generate success/cancel redirect URLs that point to the running frontend.
console.log("Effective CLIENT_URL:", process.env.CLIENT_URL || process.env.VITE_CLIENT_URL || "http://localhost:5173");

const app = express();
const PORT = process.env.PORT || 3003;

// Convert import.meta.url to __dirname equivalent for ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Clerk middleware attaches auth/session info to incoming requests (req.auth)
// and must be mounted before routes that rely on authentication.

// CORS middleware for development: allow frontend dev server to access API with credentials
app.use((req, res, next) => {
  // Echo the request origin when available so local dev ports (5173/5174/etc.) are allowed.
  const origin = req.headers.origin;
  const allowedOrigin = process.env.FRONTEND_ORIGIN || origin || "http://localhost:5173";
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  // Inform caches that Access-Control-Allow-Origin varies by origin
  res.header("Vary", "Origin");
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

// Start-up: mount Clerk middleware (if configured), register routes, then start server.
async function init() {
  // Conditionally import and mount Clerk middleware so missing env vars don't crash startup
  const clerkApiKey = process.env.CLERK_API_KEY;
  const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (clerkApiKey && clerkPublishableKey) {
    try {
      const { clerkMiddleware } = await import("@clerk/express");
      app.use(clerkMiddleware());
      console.log("Clerk middleware mounted");
    } catch (err) {
      console.error("Failed to import/mount Clerk middleware:", err);
    }
  } else {
    console.warn("Clerk keys missing; skipping Clerk middleware. Set CLERK_API_KEY and CLERK_PUBLISHABLE_KEY in .env to enable Clerk.");
  }

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/coupons", couponRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/feedbacks", feedbackRoutes);
  // AI endpoints for chat and recommendations
  app.use("/api/ai", aiRoutes);

  // Fallback to index.html for client-side routing
  app.get("*", (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    }
    return res.sendFile(path.join(__dirname, "../public/index.html"));
  });

  const server = app.listen(PORT, () => {
    console.log("Server is running on http://localhost:" + PORT);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. To free the port, find the process using it and terminate it.`);
      console.error('On Windows: run in an elevated Command Prompt:');
      console.error(`  netstat -ano | findstr :${PORT}`);
      console.error('  taskkill /PID <PID_FROM_PREVIOUS> /F');
      console.error('Or set environment variable PORT to another free port and restart.');
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

init();
