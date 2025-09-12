import React from "react";
import { ClerkProvider } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function ClerkProviderWithNavigate({ children }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider publishableKey={clerkPubKey} navigate={(to) => navigate(to)}>
      {children}
    </ClerkProvider>
  );
}
