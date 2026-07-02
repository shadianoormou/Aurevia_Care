import axios from "axios";

// Central Axios instance. In dev, Vite proxies /api to the backend (see vite.config.js),
// so VITE_API_URL is optional locally but required for production builds where
// there is no dev proxy. withCredentials lets the httpOnly JWT cookie be sent automatically.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

// Also attach token from localStorage as a fallback (in case cookies
// are blocked, e.g. some browser privacy settings)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medimart_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
