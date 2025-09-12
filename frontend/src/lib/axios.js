import axios from "axios";

const base = import.meta.env.VITE_API_BASE_URL || "/api";

const axiosInstance = axios.create({
	baseURL: base,
	withCredentials: true,
});

export default axiosInstance;
