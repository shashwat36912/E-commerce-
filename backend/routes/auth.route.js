import express from "express";
import { getProfile, updateUser } from "../controllers/auth.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, updateUser);

// Admin: update any user by id
router.put("/users/:id", protectRoute, adminRoute, async (req, res, next) => {
	try {
		const { id } = req.params;
		const incoming = req.body || {};

		const User = (await import("../models/user.model.js")).default;
		const user = await User.findById(id);
		if (!user) return res.status(404).json({ message: "User not found" });

		// Only allow specific fields to be updated by admin
		const allowed = ["name", "email", "role", "isAdmin"];
		const updates = {};
		for (const key of Object.keys(incoming)) {
			if (!allowed.includes(key)) continue;
			updates[key] = incoming[key];
		}

		// Ensure role, if present, is one of the allowed enum values
		if (updates.hasOwnProperty("role")) {
			const val = updates.role;
			if (val !== "customer" && val !== "admin") {
				// ignore invalid role values (e.g., boolean true/false)
				delete updates.role;
			}
		}

		// If isAdmin is provided, ensure it's boolean and keep it
		if (updates.hasOwnProperty("isAdmin")) {
			updates.isAdmin = Boolean(updates.isAdmin);
			// Keep role in sync for backward compatibility
			updates.role = updates.isAdmin ? "admin" : "customer";
		}

		Object.assign(user, updates);
		await user.save();
		const safeUser = user.toObject();
		delete safeUser.password;
		res.json({ message: "User updated", user: safeUser });
	} catch (err) {
		next(err);
	}
});

export default router;
