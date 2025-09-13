import { SignIn, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
	const { isSignedIn } = useUser();
	// If Clerk already has an active session, redirect to home to avoid multiple-session warning
	if (isSignedIn) return <Navigate to="/" replace />;

	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#071226] to-[#071827] p-6">
			<div className="w-full max-w-md p-8 bg-[rgba(15,23,42,0.6)] backdrop-blur rounded-2xl shadow-lg border border-[rgba(255,255,255,0.03)]">
				<div className="text-center mb-6">
					<h2 className="text-3xl font-bold text-white">Sign in</h2>
					<p className="text-sm muted mt-2">Access your account to manage store and orders</p>
				</div>
				<SignIn routing="path" path="/sign-in" />
			</div>
		</div>
	);
};

export default LoginPage;
