import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, writeFileSync } from "fs";

// Plugin for GitHub Pages compatibility
const githubPagesPlugin = () => {
  return {
    name: "github-pages",
    writeBundle() {
      // Copy index.html to 404.html for SPA routing support
      copyFileSync(path.resolve(__dirname, "dist/index.html"), path.resolve(__dirname, "dist/404.html"));
      
      // Ensure .nojekyll file exists to prevent Jekyll processing
      const nojekyllPath = path.resolve(__dirname, "dist/.nojekyll");
      try {
        writeFileSync(nojekyllPath, "");
      } catch (e) {
        // Ignore if file already exists or write fails
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  const base = isProduction ? process.env.BASE_PATH ?? "/" : "/";

  return {
    base,
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "production" && githubPagesPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
