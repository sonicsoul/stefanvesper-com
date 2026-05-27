import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served as a subpath of stefanvesper.com under /drums/.
// For pure local dev (npm run dev) Vite ignores `base`; for production
// builds it prefixes asset URLs with this path.
export default defineConfig({
  plugins: [react()],
  base: "/drums/",
  server: {
    port: 5173,
    open: true,
  },
});
