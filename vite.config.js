import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    open: true,
  },
  preview: {
    host: "0.0.0.0",
    open: true,
  },
  base: mode === "production" ? "/save-my-way/" : "/",
}));
