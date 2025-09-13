import toast from "react-hot-toast";
import { ShoppingCart } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import formatCurrency from "../lib/currency";
import { Link } from 'react-router-dom';
import axios from '../lib/axios';
import { useState } from 'react';

const ProductCard = ({ product }) => {
	const { user } = useUserStore();
	const { addToCart } = useCartStore();
	// Support both boolean `isAdmin` and legacy `role === 'admin'`
	const isAdmin = Boolean(user?.isAdmin) || user?.role === "admin";
	const handleAddToCart = () => {
		if (!user) {
			toast.error("Please login to add products to cart", { id: "login" });
			return;
		} else {
			// add to cart
			addToCart(product);
		}
	};

	const [showBuyers, setShowBuyers] = useState(false);
	const [buyers, setBuyers] = useState([]);
	const [loadingBuyers, setLoadingBuyers] = useState(false);

	const fetchBuyers = async (e) => {
		e?.preventDefault();
		if (!isAdmin) return;
		if (showBuyers) {
			setShowBuyers(false);
			return;
		}
		setLoadingBuyers(true);
		try {
			const res = await axios.get(`/orders?productId=${product._id}`);
			// res.data.orders is simplified by backend
			const orders = res.data.orders || [];
			// collect unique users
			const map = {};
			orders.forEach(o => {
				if (o.user) map[o.user._id] = o.user;
			});
			setBuyers(Object.values(map));
			setShowBuyers(true);
		} catch (err) {
			console.error('Failed to fetch buyers', err?.message || err);
			setBuyers([]);
			setShowBuyers(true);
		} finally {
			setLoadingBuyers(false);
		}
	};

	return (
			<Link to={`/product/${product._id}`} className='no-underline'>
				<div className='flex w-full relative flex-col overflow-hidden rounded-lg card-surface'>
					<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
						<img loading="lazy" className='object-cover w-full' src={product.image} alt='product image' />
						<div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent' />
					</div>

					<div className='mt-4 px-5 pb-5'>
						<h5 className='text-lg md:text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
						<div className='mt-2 mb-5 flex items-center justify-between'>
							<p>
								<span className='text-2xl md:text-3xl font-extrabold text-primary'>{formatCurrency(product.price)}</span>
							</p>
						</div>
						{!isAdmin && (
							<button
								className='btn-primary w-full justify-center'
								onClick={(e) => {
									// prevent navigating to details when clicking Add to cart
									e.preventDefault();
									handleAddToCart();
								}}
							>
								<ShoppingCart size={20} className='mr-2' />
								Add to cart
							</button>
						)}
						{isAdmin && (
							<button
								className='mt-3 w-full px-3 py-2 rounded-md btn-ghost'
								onClick={fetchBuyers}
							>
								{loadingBuyers ? 'Loading buyers...' : (showBuyers ? 'Hide buyers' : 'Show buyers')}
							</button>
						)}
					</div>
					{isAdmin && showBuyers && (
						<div className="mt-3 bg-[rgba(255,255,255,0.02)] p-3 rounded">
							{buyers.length === 0 ? (
								<div className="text-sm muted">No buyers found for this product.</div>
							) : (
								<ul className="space-y-2 text-sm">
									{buyers.map(b => (
										<li key={b._id} className="flex items-center justify-between">
											<div>
												<div className="font-medium text-white">{b.name || b.email}</div>
												<div className="text-sm muted">{b.email}</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					)}
				</div>
			</Link>
	);
};
export default ProductCard;
