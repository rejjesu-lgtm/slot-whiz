import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync } from "fs";

// Plugin to copy index.html to 404.html for GitHub Pages SPA routing
const githubPagesPlugin = () => {
  return {
    name: "github-pages-404",
    writeBundle() {
      copyFileSync(path.resolve(__dirname, "dist/index.html"), path.resolve(__dirname, "dist/404.html"));
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  // Use a relative base by default for production builds so assets load correctly
  // when the app is deployed to GitHub Pages or other static hosts without
  // an explicit BASE_PATH environment variable.
  const base = isProduction ? process.env.BASE_PATH ?? "./" : "/";

  return {
    base,
    server: {
      // Bind to 0.0.0.0 so the dev server listens on IPv4 and is reachable
      // via localhost and network interfaces. Using '::' can sometimes cause
      // reachability issues on Windows environments.
      host: "0.0.0.0",
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
