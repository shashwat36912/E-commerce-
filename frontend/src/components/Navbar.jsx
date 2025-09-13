import { ShoppingCart, UserPlus, LogIn, LogOut, Lock, User, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import { useClerk } from "@clerk/clerk-react";
import { useState, Suspense, lazy } from 'react';
const ChatWidget = lazy(() => import('./ChatWidget'));

const Navbar = () => {
	const [chatOpen, setChatOpen] = useState(false);
	const { user, clearUser } = useUserStore();
	// Support both new `isAdmin` boolean and legacy `role === 'admin'` field
	const isAdmin = Boolean(user?.isAdmin) || user?.role === "admin";
	const { signOut } = useClerk();
	const { cart } = useCartStore();

	return (
		<header className='fixed top-0 left-0 w-full bg-[rgba(7,12,20,0.7)] backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-[rgba(20,120,102,0.12)]'>
			<div className='container mx-auto px-4 py-4'>
				<div className='flex flex-wrap justify-between items-center'>
					<Link to='/' className='text-2xl font-bold text-primary items-center space-x-2 flex'>
						<span className='inline-block bg-gradient-to-r from-primary/80 to-primary/40 bg-clip-text text-transparent'>E-Commerce</span>
					</Link>

					<nav className='flex flex-wrap items-center gap-4'>
						{/* Help button shown only to non-admin users */}
						{!isAdmin && (
							<button onClick={() => setChatOpen(true)} className='text-sm px-3 py-1 rounded-md border border-transparent text-muted transition' style={{'--hover-bg':'rgba(15,118,110,0.08)'}} onMouseOver={(e)=>e.currentTarget.style.backgroundColor='var(--hover-bg)'} onMouseOut={(e)=>e.currentTarget.style.backgroundColor='transparent'}>Help</button>
						)}
						{/* Home button (explicit) */}
						<Link to={'/'} className='text-muted hover:text-white transition duration-300 ease-in-out flex items-center'>
							<Home className='inline-block mr-1' size={18} />
							<span className='hidden sm:inline'>Home</span>
						</Link>

						{/* Cart for customers, Dashboard link for admins */}
						{!isAdmin ? (
							<Link to={'/cart'} className='relative group flex items-center text-muted hover:text-white transition duration-300 ease-in-out'>
								<ShoppingCart className='inline-block mr-1' size={20} />
								<span className='hidden sm:inline'>Cart</span>
								{cart?.length > 0 && (
									<span className='absolute -top-2 -left-2 bg-[var(--color-primary)] text-white rounded-full px-2 py-0.5 text-xs'>
										{cart.length}
									</span>
								)}
							</Link>
						) : (
							isAdmin && (
								<Link to={'/secret-dashboard'} className='text-muted hover:text-white transition duration-300 ease-in-out flex items-center'>
									<Lock className='inline-block mr-1' size={18} />
									<span className='hidden sm:inline'>Dashboard</span>
								</Link>
							)
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
									className='px-3 py-1 rounded-md border border-transparent text-muted hover:text-white hover:bg-primary/10 transition flex items-center'
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
									className='text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
									style={{backgroundColor:'var(--color-primary)'}}
									onMouseOver={(e)=>e.currentTarget.style.backgroundColor='rgba(15,118,110,0.95)'}
									onMouseOut={(e)=>e.currentTarget.style.backgroundColor='var(--color-primary)'}
								>
									<UserPlus className='mr-2' size={18} />
									Sign Up
								</Link>
								<Link
									to={'/sign-in'}
									className='text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out'
									style={{backgroundColor:'rgba(255,255,255,0.04)'}}
									onMouseOver={(e)=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.06)'}
									onMouseOut={(e)=>e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'}
								>
									<LogIn className='mr-2' size={18} />
									Login
								</Link>
							</>
						)}
					</nav>
					<Suspense fallback={null}>
						{!isAdmin && chatOpen && <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />}
					</Suspense>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
