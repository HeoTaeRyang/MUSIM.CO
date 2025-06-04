import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      "/video": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/rank": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/attendance": {
        target: "http://localhost:5000", // ⚠️ 추가 필요!
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
