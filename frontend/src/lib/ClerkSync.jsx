import { useEffect } from "react";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useUserStore } from "../stores/useUserStore";

export default function ClerkSync() {
  const { isSignedIn } = useClerkUser() || {};
  const { checkAuth, clearUser } = useUserStore();

  useEffect(() => {
    if (isSignedIn) {
      // Sync server-side persisted user data when Clerk signs in
      checkAuth();
    } else {
      // Clear local user when signed out
      clearUser();
    }
  }, [isSignedIn, checkAuth, clearUser]);

  return null;
}
