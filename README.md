# Slot Whiz

React + Vite application for managing slot bookings. The project is ready for continuous deployment to GitHub Pages, including support for a custom domain (`mbss.in`).

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd slot-whiz
npm install
npm run dev
```

Open `http://localhost:5173` to develop locally.

## Project Structure

- `src/` — application source code (React + TypeScript + shadcn/ui)
- `public/` — static assets copied as-is during build (includes `CNAME`)
- `supabase/` — edge functions and SQL migrations
- `dist/` — production build output

## Available Scripts

- `npm run dev` — start the local development server
- `npm run build` — create an optimized production build in `dist`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint across the repo

## GitHub Pages Deployment

This repository ships with an automated GitHub Actions workflow in `.github/workflows/deploy.yml`.

1. Push to the `main` branch (or trigger the workflow manually from the Actions tab).
2. The workflow installs dependencies, builds the site, and publishes `dist/` to GitHub Pages using the new Pages deployment APIs.
3. The workflow automatically determines the base path:
   - If `public/CNAME` (or root `CNAME`) exists, the build uses `/`, suitable for the custom domain `mbss.in`.
   - Otherwise it defaults to `/<repo-name>/`, which matches standard project pages.

You can override the base path manually by setting the `BASE_PATH` environment variable when running `npm run build`.

## Troubleshooting

- Ensure Node.js 18+ is installed locally (`nvm install 20` is recommended).
- After updating dependencies, re-run `npm run build` to confirm the production bundle succeeds.
- If you change the custom domain, update both `CNAME` at the repository root and `public/CNAME` so the workflow deploys it with the site.
