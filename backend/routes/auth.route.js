import express from "express";
import { login, logout, signup, refreshToken, getProfile, updateUser } from "../controllers/auth.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);
// Update own profile
router.put("/profile", protectRoute, updateUser);
// Admin: update any user by id
router.put("/users/:id", protectRoute, adminRoute, async (req, res, next) => {
	// Delegate to controller method if you want shared logic; simple inline handler for now
	try {
		const { id } = req.params;
		const updates = req.body;
		const user = await (await import("../models/user.model.js")).default.findById(id);
		if (!user) return res.status(404).json({ message: 'User not found' });
		Object.assign(user, updates);
		await user.save();
		const safeUser = user.toObject();
		delete safeUser.password;
		res.json({ message: 'User updated', user: safeUser });
	} catch (err) {
		next(err);
	}
});

export default router;
