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

		// Normalize and validate product prices and quantities. Convert to smallest currency unit (paise for INR).
		const processedProducts = products.map((product, idx) => {
			// Price may come as a number or formatted string (e.g., "₹1,234.00"). Strip non-numeric chars except dot and minus.
			const rawPrice = product.price;
			const priceNumber =
				typeof rawPrice === "string"
					? parseFloat(rawPrice.replace(/[^0-9.-]+/g, ""))
					: Number(rawPrice);

			if (!isFinite(priceNumber) || Number.isNaN(priceNumber)) {
				const nameOrId = product.name || product._id || `index:${idx}`;
				return { error: `Invalid price for product ${nameOrId}` };
			}

			const quantity = Number(product.quantity) || 1;
			if (!Number.isFinite(quantity) || quantity <= 0) {
				const nameOrId = product.name || product._id || `index:${idx}`;
				return { error: `Invalid quantity for product ${nameOrId}` };
			}

			// Stripe expects integer in smallest currency unit. For INR, multiply by 100 (paise).
			const unitAmount = Math.round(priceNumber * 100);
			totalAmount += unitAmount * quantity;

			return {
				...product,
				priceNumber,
				unitAmount,
				quantity,
			};
		});

		// If any product had an error, return 400 with details
		const bad = processedProducts.find((p) => p && p.error);
		if (bad) {
			return res.status(400).json({ error: bad.error });
		}

		const lineItems = processedProducts.map((product) => ({
			price_data: {
				currency: "inr",
				product_data: {
					name: product.name,
					images: [product.image],
				},
				unit_amount: product.unitAmount,
			},
			quantity: product.quantity || 1,
		}));

		// If a coupon code was provided, look it up and compute the expected
		// final amount (paise) after applying the coupon percentage. We do
		// NOT mutate `totalAmount` here because Stripe will apply the
		// discount via the `discounts` property below; instead compute
		// `finalAmount` for validation (minimum order) and later use Stripe
		// discounts so the session's `amount_total` matches expectations.
		let coupon = null;
		let finalAmount = totalAmount;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				const discountPaise = Math.round((totalAmount * coupon.discountPercentage) / 100);
				finalAmount = totalAmount - discountPaise;
			}
		}

		// Enforce a minimum order amount to satisfy Stripe's minimum (in smallest currency unit, paise)
		// Default raised to 5000 paise (₹50) to avoid Stripe `amount_too_small` errors for INR payments.
		const MIN_ORDER_PAISE = Number(process.env.MIN_ORDER_PAISE || 5000); // default 5000 paise = ₹50
		if (finalAmount < MIN_ORDER_PAISE) {
			const human = (finalAmount / 100).toFixed(2);
			return res.status(400).json({ message: `Order total after discounts ₹${human} is below the minimum order amount. Please add more items to proceed.` });
		}

		let session;
		// Resolve client URL with safe fallback for local development.
		// Declare outside the try block so it's available for later logging even if
		// the create() call throws and we still want to report the intended URL.
		const clientUrl = process.env.CLIENT_URL || process.env.VITE_CLIENT_URL || "http://localhost:5173";

		try {
			session = await stripe.checkout.sessions.create({
				payment_method_types: ["card"],
				line_items: lineItems,
				mode: "payment",
				success_url: `${clientUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${clientUrl}/purchase-cancel`,
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
					// store id, quantity and numeric price (in main currency units) for later order creation
					products: JSON.stringify(
						processedProducts.map((p) => ({
							id: p._id,
							quantity: p.quantity,
							price: p.priceNumber,
						}))
					),
				},
			});
		} catch (err) {
			// Provide a friendly error for small amounts or bubble up otherwise
			if (err && err.code === "amount_too_small") {
				console.warn("Stripe amount_too_small:", err.raw?.message || err.message);
				return res.status(400).json({ message: err.raw?.message || "Total amount too small for checkout" });
			}
			// rethrow other errors to be handled by outer catch
			throw err;
		}

		// Debug: log the redirect URL used for this checkout session
		try {
			const successUrl = `${clientUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`;
			console.log("[checkout] success_url:", successUrl);
		} catch (e) {
			console.warn("[checkout] failed to log success_url", e);
		}

		// totalAmount currently in smallest currency unit (paise). Create coupon if total >= 20000 paise (i.e., ₹200)
		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

// Return payment-related config to clients (e.g. minimum order amount)
export const getPaymentConfig = async (req, res) => {
	try {
		const MIN_ORDER_PAISE = Number(process.env.MIN_ORDER_PAISE || 5000);
		return res.status(200).json({ minOrderPaise: MIN_ORDER_PAISE });
	} catch (err) {
		console.error("Failed to return payment config", err);
		return res.status(500).json({ message: "Failed to return payment config" });
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
				totalAmount: session.amount_total / 100, // convert from smallest currency unit (paise) to main unit (INR)
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
