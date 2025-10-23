import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const target = process.env.VITE_API_URL || "http://iris-backend:3000"; // ✅ ชี้ไป service backend

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // 0.0.0.0
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target,
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
