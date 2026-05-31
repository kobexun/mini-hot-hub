import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ["mini-hot-hub-client-production.up.railway.app"],
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
});
