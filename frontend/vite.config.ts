import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      "/video": {
        target: "https://web-production-6e732.up.railway.app",
        changeOrigin: true,
        secure: false,
      },
      "/rank": {
        target: "https://web-production-6e732.up.railway.app",
        changeOrigin: true,
        secure: false,
      },
      "/attendance": {
        target: "https://web-production-6e732.up.railway.app", // ⚠️ 추가 필요!
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
