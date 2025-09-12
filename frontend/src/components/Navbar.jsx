import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, User, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useClerk } from "@clerk/clerk-react";
import { useState } from 'react';
import ChatWidget from './ChatWidget';

const Navbar = () => {
	const [chatOpen, setChatOpen] = useState(false);
	const { user, clearUser } = useUserStore();
	// Support both new `isAdmin` boolean and legacy `role === 'admin'` field
	const isAdmin = Boolean(user?.isAdmin) || user?.role === "admin";
	const { signOut } = useClerk();
	const { cart } = useCartStore();

	return (
		<header className='fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800'>
			<div className='container mx-auto px-4 py-3'>
				<div className='flex flex-wrap justify-between items-center'>
					<Link to='/' className='text-2xl font-bold text-emerald-400 items-center space-x-2 flex'>
						E-Commerce
					</Link>

					<nav className='flex flex-wrap items-center gap-4'>
						<button onClick={() => setChatOpen(true)} className='text-gray-300 hover:text-emerald-400 transition duration-300 px-2 py-1 rounded'>Help</button>
						{/* Home button (explicit) */}
						<Link to={'/'} className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center'>
							<Home className='inline-block mr-1' size={18} />
							<span className='hidden sm:inline'>Home</span>
						</Link>
						{!isAdmin && (
							<Link to={'/cart'} className='relative group flex items-center text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out'>
								<ShoppingCart className='inline-block mr-1' size={20} />
								<span className='hidden sm:inline'>Cart</span>
								{cart?.length > 0 && (
									<span className='absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs'>
										{cart.length}
									</span>
								)}
							</Link>
						)}

						{isAdmin && (
							<Link
								className='bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center'
								to={'/secret-dashboard'}
							>
								<Lock className='inline-block mr-1' size={18} />
								<span className='hidden sm:inline'>Dashboard</span>
							</Link>
						)}

						{user ? (
							<>
								<Link
									to={'/profile'}
									className='text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out flex items-center'
								>
									<User className='inline-block mr-1' size={16} />
									<span className='hidden sm:inline'>{user.name || 'Account'}</span>
								</Link>

								<button
									className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
									onClick={async () => { await signOut(); clearUser(); }}
								>
									<LogOut size={18} />
									<span className='hidden sm:inline ml-2'>Log Out</span>
								</button>
							</>
						) : (
							<>
								<Link
									to={'/sign-up'}
									className='bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
								>
									<UserPlus className='mr-2' size={18} />
									Sign Up
								</Link>
								<Link
									to={'/sign-in'}
									className='bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
								>
									<LogIn className='mr-2' size={18} />
									Login
								</Link>
							</>
						)}
					</nav>
					<ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
				</div>
			</div>
		</header>
	);
};

export default Navbar;
