import axios from "axios";

// Central Axios instance. In dev, Vite proxies /api to the backend (see vite.config.js),
// so VITE_API_URL is optional locally but required for production builds where
// there is no dev proxy. withCredentials lets the httpOnly JWT cookie be sent automatically.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
});

export default api;
