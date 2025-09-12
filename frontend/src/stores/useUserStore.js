import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	// Login and signup flows are now handled by Clerk UI on the frontend.
	// Use `checkAuth()` after Clerk session changes to sync local user state.



	clearUser: () => {
		// Called after Clerk signOut to clear local store state
		set({ user: null });
	},

	setUser: (user) => {
		set({ user });
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},

	// Update current user's profile
	updateProfile: async (updates) => {
		set({ loading: true });
		try {
			const res = await axios.put('/auth/profile', updates);
			set({ user: res.data.user || res.data, loading: false });
			toast.success(res.data.message || 'Profile updated');
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || 'Failed to update profile');
		}
	},

	refreshToken: async () => {
		// Token refresh moved to Clerk; frontend should rely on Clerk sessions.
		return null;
	},
}));

// Authentication and token lifecycle are handled by Clerk; axios interceptors
// for JWT refresh are not needed.
