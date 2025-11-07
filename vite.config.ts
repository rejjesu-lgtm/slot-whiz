import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  // 🔑 ADD THIS LINE TO SET THE BASE PATH FOR GITHUB PAGES 🔑
  base: "/slot-whiz/", 

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
