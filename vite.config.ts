import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { copyFileSync, existsSync } from "fs";

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

  const resolveBasePath = () => {
    if (!isProduction) {
      return "/";
    }

    if (process.env.BASE_PATH) {
      return process.env.BASE_PATH;
    }

    const hasCustomDomain =
      existsSync(path.resolve(__dirname, "public/CNAME")) ||
      existsSync(path.resolve(__dirname, "CNAME"));

    if (hasCustomDomain) {
      return "/";
    }

    const repository = process.env.GITHUB_REPOSITORY;
    if (repository?.includes("/")) {
      const [, repoName] = repository.split("/");
      if (repoName) {
        return `/${repoName}/`;
      }
    }

    return "./";
  };

  const base = resolveBasePath();

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
