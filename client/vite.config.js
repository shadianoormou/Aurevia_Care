import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config with a dev proxy so the frontend can call
// /api/... and have it forwarded to the Express backend on port 5000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
