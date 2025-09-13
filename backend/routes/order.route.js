import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";

const router = express.Router();

// GET /api/orders - list orders (admin only)
// Optional query param: productId to filter orders containing a specific product
router.get("/", protectRoute, adminRoute, async (req, res) => {
  try {
    const filter = {};
    if (req.query.productId) {
      filter['products.product'] = req.query.productId;
    }

    const orders = await Order.find(filter)
      .populate({ path: "products.product", model: "Product", select: "name" })
      .populate({ path: "user", model: "User", select: "name email" })
      .sort({ createdAt: -1 });

    // Simplify order items for API clients
    const simplified = orders.map((o) => ({
      _id: o._id,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      user: o.user ? { _id: o.user._id, name: o.user.name, email: o.user.email } : null,
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
