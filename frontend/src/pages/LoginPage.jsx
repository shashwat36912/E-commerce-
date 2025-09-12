import { SignIn, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const LoginPage = () => {
	const { isSignedIn } = useUser();
	// If Clerk already has an active session, redirect to home to avoid multiple-session warning
	if (isSignedIn) return <Navigate to="/" replace />;

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-900">
			<div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow">
				<SignIn routing="path" path="/sign-in" />
			</div>
		</div>
	);
};

export default LoginPage;
