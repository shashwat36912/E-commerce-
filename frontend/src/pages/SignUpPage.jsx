import { SignUp, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const SignUpPage = () => {
	const { isSignedIn } = useUser();
	if (isSignedIn) return <Navigate to="/" replace />;

	return (
		<div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#071226] to-[#071827] p-6">
			<div className="w-full max-w-md p-8 bg-[rgba(15,23,42,0.6)] backdrop-blur rounded-2xl shadow-lg border border-[rgba(255,255,255,0.03)]">
				<div className="text-center mb-6">
					<h2 className="text-3xl font-bold text-white">Create your account</h2>
					<p className="text-sm muted mt-2">Sign up to manage products, orders and view analytics</p>
				</div>
				<SignUp routing="path" path="/sign-up" />
			</div>
		</div>
	);
};

export default SignUpPage;
