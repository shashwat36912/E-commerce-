import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); 
			totalAmount += amount * product.quantity;

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						images: [product.image],
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
			},
		});

		// Debug: log the redirect URL used for this checkout session
		try {
			const successUrl = `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
			console.log("[checkout] success_url:", successUrl);
		} catch (e) {
			console.warn("[checkout] failed to log success_url", e);
		}

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;

		if (!sessionId) {
			console.warn("checkoutSuccess called without sessionId");
			return res.status(400).json({ message: "Missing sessionId in request body" });
		}

		let session;
		try {
			session = await stripe.checkout.sessions.retrieve(sessionId);
		} catch (err) {
			console.error("Failed to retrieve Stripe session", err.message || err);
			return res.status(502).json({ message: "Failed to retrieve Stripe session", error: err.message });
		}

		if (!session) {
			return res.status(404).json({ message: "Stripe session not found" });
		}

		if (session.payment_status !== "paid") {
			console.warn(`Session ${sessionId} has payment_status=${session.payment_status}`);
			return res.status(400).json({ message: `Session is not paid (status: ${session.payment_status})` });
		}

		// If we reach here, payment_status === 'paid'
		// Deactivate coupon if present
		if (session.metadata?.couponCode) {
			try {
				await Coupon.findOneAndUpdate(
					{
						code: session.metadata.couponCode,
						userId: session.metadata.userId,
					},
					{
						isActive: false,
					}
				);
			} catch (err) {
				console.warn("Failed to deactivate coupon", err.message || err);
			}
		}

		// create a new Order
		let products = [];
		try {
			products = JSON.parse(session.metadata?.products || "[]");
		} catch (err) {
			console.error("Failed to parse products metadata", err.message || err);
			return res.status(400).json({ message: "Invalid products metadata in session" });
		}

		try {
			// Build order document data
			const orderData = {
				user: session.metadata?.userId,
				products: (products || []).map((product) => ({
					product: product.id,
					quantity: product.quantity,
					price: product.price,
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars,
				stripeSessionId: sessionId,
			};

			// Use atomic upsert to avoid duplicate key errors if this endpoint is called multiple times
			const order = await Order.findOneAndUpdate(
				{ stripeSessionId: sessionId },
				{ $setOnInsert: orderData },
				{ new: true, upsert: true }
			);

			return res.status(200).json({
				success: true,
				message: "Payment successful, order created (or already existed).",
				orderId: order._id,
			});
		} catch (err) {
			console.error("Error creating order after successful payment:", err.message || err);
			return res.status(500).json({ message: "Failed to create order", error: err.message });
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}
