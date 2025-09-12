import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const LOCAL_CART_KEY = "local_cart_v1";

function saveCartToLocal(cart) {
	try {
		if (typeof window !== "undefined" && window.localStorage) {
			window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart || []));
		}
	} catch (e) {
		
	}
}

function loadCartFromLocal() {
	try {
		if (typeof window !== "undefined" && window.localStorage) {
			const raw = window.localStorage.getItem(LOCAL_CART_KEY);
			if (!raw) return [];
			return JSON.parse(raw);
		}
	} catch (e) {
		// ignore
	}
	return [];
}

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			// Backend returns items as [{ product: {...}, quantity }] when populated.
			// Normalize to frontend expected shape: { _id, name, price, image, quantity, ... }
			const normalized = (res.data || []).map((item) => {
				if (item && item.product) {
					const p = item.product;
					return {
						...p,
						_id: p._id || p.id,
						quantity: item.quantity || 1,
					};
				}
				// Already in flat shape (e.g., local optimistic updates)
				return {
					...item,
					_id: item._id || item.id,
					quantity: item.quantity || 1,
				};
			});
			set({ cart: normalized });
			get().calculateTotals();
			// persist copy for guests
			saveCartToLocal(normalized);
		} catch (error) {
			// If the request fails due to unauthenticated user or network
			// fallback to localStorage-stored cart so guests can still see items
			const status = error?.response?.status;
			if (status === 401 || !error?.response) {
				const local = loadCartFromLocal();
				set({ cart: local });
				get().calculateTotals();
				return;
			}
			set({ cart: [] });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
		try {
			// best-effort server clear for authenticated users
			await axios.delete(`/cart`);
		} catch (e) {
			// ignore server errors for guests
		}
		saveCartToLocal([]);
	},
	addToCart: async (product) => {
		try {
			await axios.post("/cart", { productId: product._id });
			toast.success("Product added to cart");
			// Refresh from server to get consistent shapes
			await get().getCartItems();
		} catch (error) {
			const status = error?.response?.status;
			if (status === 401 || !error?.response) {
				// Fallback: perform a local optimistic update for guest
				const current = get().cart || [];
				const idx = current.findIndex((c) => c._id === product._id);
				let updated;
				if (idx > -1) {
					updated = current.map((c, i) => (i === idx ? { ...c, quantity: (c.quantity || 1) + 1 } : c));
				} else {
					updated = [...current, { ...product, _id: product._id || product.id, quantity: 1 }];
				}
				set({ cart: updated });
				get().calculateTotals();
				saveCartToLocal(updated);
				toast.success("Product added to cart");
				return;
			}
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
		try {
			await axios.delete(`/cart`, { data: { productId } });
			// Refresh from server
			await get().getCartItems();
		} catch (error) {
			const status = error?.response?.status;
			if (status === 401 || !error?.response) {
				const current = get().cart || [];
				const updated = current.filter((i) => i._id !== productId);
				set({ cart: updated });
				get().calculateTotals();
				saveCartToLocal(updated);
				return;
			}
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			await get().removeFromCart(productId);
			return;
		}

		try {
			await axios.put(`/cart/${productId}`, { quantity });
			// Refresh for consistency
			await get().getCartItems();
		} catch (error) {
			const status = error?.response?.status;
			if (status === 401 || !error?.response) {
				const current = get().cart || [];
				const updated = current.map((c) => (c._id === productId ? { ...c, quantity } : c));
				set({ cart: updated });
				get().calculateTotals();
				saveCartToLocal(updated);
				return;
			}
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	calculateTotals: () => {
		const { cart, coupon } = get();
		const subtotal = cart.reduce((sum, item) => {
			let price = item.price;
			if (typeof price === "string") {
				price = parseFloat(price.replace(/[^0-9.-]+/g, ""));
			}
			price = Number(price) || 0;
			return sum + price * (item.quantity || 1);
		}, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });
	},
}));
