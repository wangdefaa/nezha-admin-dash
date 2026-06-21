import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// 管理后台前端挂在 /dashboard/ 下，构建产物直接输出到后端的 embed 目录 admin-dist。
export default defineConfig({
  base: "/dashboard/",
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5174,
    proxy: {
      "/api": { target: "http://127.0.0.1:8008", changeOrigin: true },
      "/ws": { target: "ws://127.0.0.1:8008", ws: true, changeOrigin: true },
    },
  },
})
