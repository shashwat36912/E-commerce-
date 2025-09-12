import User from "../models/user.model.js";

export const getProfile = async (req, res) => {
  try {
	if (!req.user) return res.status(401).json({ message: "Unauthorized" });
	const safeUser = req.user.toObject ? req.user.toObject() : req.user;
	delete safeUser.password;
	res.json(safeUser);
  } catch (error) {
	res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
	const userId = req.user?._id;
	if (!userId) return res.status(401).json({ message: "Unauthorized" });

	const allowedFields = ["name", "email"]; // password is managed by Clerk
	const updates = {};
	for (const key of Object.keys(req.body)) {
	  if (allowedFields.includes(key)) updates[key] = req.body[key];
	}

	let user = await User.findById(userId);
	if (!user) return res.status(404).json({ message: "User not found" });

	Object.assign(user, updates);
	await user.save();

	const safeUser = user.toObject();
	delete safeUser.password;

	res.status(200).json({ message: "User updated successfully", user: safeUser });
  } catch (error) {
	console.log("Error in updateUser controller", error.message);
	res.status(500).json({ message: "Error updating user", error: error.message });
  }
};
