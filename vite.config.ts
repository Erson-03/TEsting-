import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite keeps the React + TypeScript developer experience fast and simple.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
});
