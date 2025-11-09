import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, writeFileSync, existsSync } from "fs";

// Plugin for GitHub Pages compatibility
const githubPagesPlugin = () => {
  return {
    name: "github-pages",
    writeBundle() {
      const distPath = path.resolve(__dirname, "dist");
      const indexHtmlPath = path.resolve(distPath, "index.html");
      const notFoundHtmlPath = path.resolve(distPath, "404.html");
      const nojekyllPath = path.resolve(distPath, ".nojekyll");
      
      // Ensure index.html exists (Vite should create it, but ensure it's there)
      try {
        if (!existsSync(indexHtmlPath)) {
          console.warn("index.html not found in dist, this should not happen in a normal Vite build");
        } else {
          // Copy index.html to 404.html for SPA routing support
          copyFileSync(indexHtmlPath, notFoundHtmlPath);
        }
      } catch (e) {
        console.error("Error copying index.html to 404.html:", e);
      }
      
      // Ensure .nojekyll file exists to prevent Jekyll processing
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
