import React from "react";
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import formatCurrency from "../lib/currency";
import toast from "react-hot-toast";

const stripePromise = loadStripe(
	"pk_test_51S5pB7CeKgQ7jgriybLNvuOkWQATiQavMf8iRLRNinjfLw04sByjrZCEEYTM1u3xuh2CWJU8aHhHWodkH72xDLld00vOlNpNIE"
);

const OrderSummary = () => {
	const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();

	const savings = subtotal - total;
	const formattedSubtotal = formatCurrency(subtotal);
	const formattedTotal = formatCurrency(total);
	const formattedSavings = formatCurrency(savings);

	const MIN_ORDER_DEFAULT = 50; // fallback client-side minimum (INR)
	const [minOrderInr, setMinOrderInr] = React.useState(MIN_ORDER_DEFAULT);

	React.useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const res = await axios.get('/payments/config');
				const paise = Number(res.data?.minOrderPaise || 0);
				if (!Number.isFinite(paise) || paise <= 0) return;
				const inr = paise / 100;
				if (mounted) setMinOrderInr(inr);
			} catch (err) {
				// ignore and use default
			}
		})();
		return () => { mounted = false; };
	}, []);

	const handlePayment = async () => {
		const MIN_ORDER_INR = minOrderInr || MIN_ORDER_DEFAULT;
		if ((total || 0) < MIN_ORDER_INR) {
			toast.error(`Minimum order amount is ₹${MIN_ORDER_INR}. Please add more items.`);
			return;
		}
		const stripe = await stripePromise;
		// Sanitize products payload: only send what the backend expects to avoid nulls/extra shapes
		const payloadProducts = (cart || []).map((p) => ({
			_id: p._id || p.id || null,
			name: p.name || "",
			price: p.price,
			quantity: p.quantity || 1,
			image: p.image || "",
		}));

		console.debug("Checkout payload products:", payloadProducts);

		try {
			const res = await axios.post("/payments/create-checkout-session", {
				products: payloadProducts,
				couponCode: coupon ? coupon.code : null,
			});

			const session = res.data;
			const result = await stripe.redirectToCheckout({ sessionId: session.id });

			if (result.error) {
				console.error("Error:", result.error);
				toast.error(result.error.message || "Checkout failed");
			}
		} catch (err) {
			console.error("Checkout failed:", err);
			toast.error(err.response?.data?.message || err.message || "Checkout failed");
		}
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-emerald-400'>Order summary</p>

			<div className='space-y-4'>
				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-gray-300'>Original price</dt>
						<dd className='text-base font-medium text-white'>{formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Savings</dt>
							<dd className='text-base font-medium text-emerald-400'>-{formattedSavings}</dd>
						</dl>
					)}

					{coupon && isCouponApplied && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Coupon ({coupon.code})</dt>
							<dd className='text-base font-medium text-emerald-400'>-{coupon.discountPercentage}%</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
						<dt className='text-base font-bold text-white'>Total</dt>
						<dd className='text-base font-bold text-emerald-400'>{formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-emerald-300 ${
						(total || 0) < (minOrderInr || MIN_ORDER_DEFAULT) ? "bg-gray-600 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
					}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handlePayment}
						disabled={(total || 0) < (minOrderInr || MIN_ORDER_DEFAULT)}
				>
					Proceed to Checkout
				</motion.button>
				{(total || 0) < (minOrderInr || MIN_ORDER_DEFAULT) && (
					<div className="text-sm text-yellow-300 mt-2">Minimum order amount is ₹{minOrderInr || MIN_ORDER_DEFAULT}. Add more items to proceed to checkout.</div>
				)}

				<div className='flex items-center justify-center gap-2'>
					<span className='text-sm font-normal text-gray-400'>or</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline'
					>
						Continue Shopping
						<MoveRight size={16} />
					</Link>
				</div>
			</div>
		</motion.div>
	);
};
export default OrderSummary;
