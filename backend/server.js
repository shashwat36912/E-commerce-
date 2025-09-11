import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

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



app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());
// Add this BEFORE your routes

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


app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);



app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
});
