# RockWater Media — Deployment & Launch Notes

This repo is a static site (HTML/CSS/JS) intended for simple static hosting (Netlify, Vercel, GitHub Pages).

Quick notes:

- There is no build step or `package.json` in this repo; the files are served as static assets.
- Add analytics and monitoring IDs in `assets/js/analytics.js` before enabling in production.

Deploy (Netlify):

1. Create a new site and point the publish directory to the repository root.
2. Add a deployment rule if you later introduce a build step (e.g. `npm run build`).

Deploy (Vercel):

1. Import project; choose "Framework: Other" and set output directory to the repo root.
2. If you later add a build command, set it in the project settings.

Manual: copy the contents of this folder to any static host (S3, Firebase Hosting, etc.).

Checklist before publishing:

- [x] Add `manifest.webmanifest`, `favicon.svg`, and basic `<meta>` tags.
- [x] Robots and `sitemap.xml` added.
- [x] Analytics placeholder implemented at `assets/js/analytics.js` (requires IDs).
- [ ] Verify API endpoint in production and update CORS/endpoint if needed.
- [ ] Accessibility audit and fixes (keyboard navigation, semantic markup, alt text).
- [ ] Responsive verification across breakpoints.
- [ ] Add error monitoring (Sentry) and real analytics IDs.

If you want, I can add a minimal `package.json` and a Netlify/Vercel deploy configuration next.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
