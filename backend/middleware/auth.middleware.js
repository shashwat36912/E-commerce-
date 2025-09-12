import User from "../models/user.model.js";
import { getAuth, clerkClient } from "@clerk/express";

// Protect route using Clerk session information. If a Clerk user exists but
// there is no local DB user yet, create one using basic Clerk profile info.
export const protectRoute = async (req, res, next) => {
	try {
		const { userId } = getAuth(req);

		if (!userId) {
			return res.status(401).json({ message: "Unauthorized - No active session" });
		}

		let user = await User.findOne({ clerkId: userId }).select("-password");

		if (!user) {
			// Fetch clerk user info to seed our local user record
			try {
				const clerkUser = await clerkClient.users.getUser(userId);
				const email = clerkUser.primaryEmailAddress?.emailAddress ||
					(clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) ||
					"";
				// Prefer first/last name, fall back to fullName, then email local-part, then a default
				let name = "";
				if (clerkUser.firstName) {
					name = `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim();
				} else if (clerkUser.fullName) {
					name = clerkUser.fullName;
				} else if (email) {
					name = email.split("@")[0];
				} else {
					name = "Customer";
				}

				user = await User.create({ clerkId: userId, email, name });
			} catch (err) {
				console.error("Failed to create local user from Clerk data", err?.message || err);
				return res.status(500).json({ message: "Failed to create user" });
			}
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Error in protectRoute middleware", error?.message || error);
		return res.status(401).json({ message: "Unauthorized" });
	}
};

export const adminRoute = (req, res, next) => {
	if (req.user && (req.user.role === "admin" || req.user.isAdmin)) {
		return next();
	}
	return res.status(403).json({ message: "Access denied - Admin only" });
};
