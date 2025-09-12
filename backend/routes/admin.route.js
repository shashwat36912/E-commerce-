import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

const router = express.Router();

// GET /api/admin/users - list all users (admin only)
router.get("/users", protectRoute, adminRoute, async (req, res) => {
  try {
    const users = await User.find().select("_id name email isAdmin createdAt").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error("Error fetching users", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
