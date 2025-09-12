import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";

const router = express.Router();

// GET /api/orders - list orders (admin only)
router.get("/", protectRoute, adminRoute, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({ path: "products.product", model: "Product", select: "name" })
      .sort({ createdAt: -1 });

    // Simplify order items for API clients
    const simplified = orders.map((o) => ({
      _id: o._id,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      items: o.products.map((p) => ({
        productId: p.product?._id,
        name: p.product?.name || null,
        quantity: p.quantity,
        price: p.price,
      })),
    }));

    res.json({ orders: simplified });
  } catch (err) {
    console.error("Error fetching orders", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
