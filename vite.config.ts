import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, writeFileSync } from "fs";

// Plugin to copy index.html to 404.html for GitHub Pages SPA routing
// Also ensures .nojekyll exists in dist
const githubPagesPlugin = () => {
  return {
    name: "github-pages-404",
    writeBundle() {
      const distPath = path.resolve(__dirname, "dist");
      // Copy index.html to 404.html for SPA routing
      copyFileSync(path.resolve(distPath, "index.html"), path.resolve(distPath, "404.html"));
      // Ensure .nojekyll exists to prevent Jekyll processing
      writeFileSync(path.resolve(distPath, ".nojekyll"), "");
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  // For GitHub Pages with custom domain, use "/" as base
  // The workflow sets BASE_PATH, but default to "/" for custom domain
  const base = isProduction ? (process.env.BASE_PATH || "/") : "/";

  return {
    base,
    build: {
      // Ensure assets are properly hashed and organized
      assetsDir: "assets",
      // Generate manifest for better caching
      manifest: false,
      // Ensure proper chunking
      rollupOptions: {
        output: {
          // Ensure consistent asset file names
          assetFileNames: "assets/[name].[hash].[ext]",
          chunkFileNames: "assets/[name].[hash].js",
          entryFileNames: "assets/[name].[hash].js",
        },
      },
    },
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
