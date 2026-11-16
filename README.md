# Firmly AI

A React 18 website styled with Tailwind CSS 3 and built with Vite 5.

## Run locally

Install Node.js 22, then run:

```sh
npm ci
npm run dev
```

Create the production build with `npm run build`; preview it with `npm run preview`.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and publishes `dist/` on each push to `main`, or when run manually from Actions. In repository **Settings → Pages**, set **Source** to **GitHub Actions**.

Expected URL: https://jennyjzt-blip.github.io/FirmlyAI-MVP-1.0/

Vite uses relative asset paths, and navigation uses hash routes so direct links and refreshes work on GitHub Pages without server rewrites.

## Hosted functionality

- Dashboard and directory of the original ten law firms
- Searchable, manually entered opportunities
- Student profile and application status tracking
- Cover letter outlines based on supplied profile facts
- Manual resume review checklist
- PDF/DOCX text extraction entirely in the browser (5 MB limit)
- Recruiting source bookmarks with manual check timestamps

Entries are stored in this browser's local storage. They do not sync between devices. Clearing site data removes entries. Uploaded documents and extracted resume text are held in memory, not persisted or uploaded. Do not put API keys in the React application or `VITE_*` variables: client assets are public.

GitHub Pages cannot run Python, SQLite, server-side AI requests, or scheduled recruiting collection. AI generation and automated monitoring need a separately hosted backend. The hosted UI labels its manual alternatives explicitly. No application submission is automated.

The original Flask application remains available via `START_MAC.command`; see `README_START_HERE.md` for its separate setup. Its SQLite records and local uploads are not migrated or published by the Pages workflow.

## Dependency note

Vite 5 is retained to match the requested build tools. npm audit reports development-server advisories that require a newer Vite major to resolve. The deployed Pages site consists only of static build output and does not run the Vite development server. Keep local preview and development servers restricted to localhost.
