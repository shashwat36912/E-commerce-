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

// PUT /api/admin/users/:id - update user (admin only)
router.put("/users/:id", protectRoute, adminRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.hasOwnProperty("name")) updates.name = req.body.name;
    if (req.body.hasOwnProperty("role")) updates.role = req.body.role;
    if (req.body.hasOwnProperty("isAdmin")) updates.isAdmin = Boolean(req.body.isAdmin);

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("_id name email isAdmin role createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Error updating user", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/users/:id - delete user (admin only)
router.delete("/users/:id", protectRoute, adminRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id).select("_id name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted", user });
  } catch (err) {
    console.error("Error deleting user", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
