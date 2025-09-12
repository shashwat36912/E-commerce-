import { SignUp, useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const SignUpPage = () => {
	const { isSignedIn } = useUser();
	if (isSignedIn) return <Navigate to="/" replace />;

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-900">
			<div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow">
				<SignUp routing="path" path="/sign-up" />
			</div>
		</div>
	);
};

export default SignUpPage;
