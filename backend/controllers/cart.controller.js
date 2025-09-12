import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		// Populate product references inside cartItems
		const user = await (await import("../models/user.model.js")).default
			.findById(req.user._id)
			.populate({ path: "cartItems.product", model: "Product" });

		if (!user) return res.status(404).json({ message: "User not found" });

		const items = user.cartItems.map((item) => ({
			product: item.product,
			quantity: item.quantity || 1,
		}));

		res.json(items);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = await (await import("../models/user.model.js")).default.findById(req.user._id);

		if (!user) return res.status(404).json({ message: "User not found" });

		const existingItem = user.cartItems.find((item) => item.product && item.product.toString() === productId);
		if (existingItem) {
			existingItem.quantity = (existingItem.quantity || 0) + 1;
		} else {
			user.cartItems.push({ product: productId, quantity: 1 });
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = await (await import("../models/user.model.js")).default.findById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter((item) => !(item.product && item.product.toString() === productId));
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = await (await import("../models/user.model.js")).default.findById(req.user._id);
		if (!user) return res.status(404).json({ message: "User not found" });

		const existingItem = user.cartItems.find((item) => item.product && item.product.toString() === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => !(item.product && item.product.toString() === productId));
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
