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

- Dashboard application trend with a large mock total of 25 assisted applications; Great match suggestions remain above it
- Track includes four clearly labeled draggable sample applications, plus persistent mock email/calendar connection settings (no OAuth, email access, or syncing)
- Workshop stores networking history and can reuse a selected contact/event/motivation in the cover letter studio

- Orange theme, a firm directory, and automatic Great match suggestions based on saved office/practice preferences and resume keywords
- Searchable opportunities; the manual opportunity-entry form is removed
- Student profile and application status tracking
- Mock account creation with a one-time resume setup
- Optional master cover letter upload or a clearly labeled simulated AI draft based on resume text
- PDF/DOCX extraction entirely in the browser (5 MB limit), with a paste-text alternative
- Resume replacement and cover letter editing under My Profile
- Workshop with saved resume and master cover letter, original-file downloads, local demo document reviews, and a networking-aware cover letter studio
- Discover filters for summer associate and legal intern roles, per-position Copilot/Auto previews, and a select-all bulk demo queue
- Track with compact draggable application cards, expandable activity details, and a larger calendar styled after iCalendar. An explicitly labeled sample interview appears in the current month when no real interview has been saved for that month.

Workshop follows My Profile in navigation. Transcript controls have been removed; existing local transcript data is retained without being shown.

## Local firm opportunities

Los Angeles is the initial local area. Official careers pages reviewed November 16, 2026 list student programs at [Anum Law](https://www.anumlaw.com/get-involved), [Lovell Law Group](https://lovelllawgroup.com/careers/), and [King & Siegel](https://www.kingsiegel.com/careers/). Listings link back to the firms and tell users to confirm availability, timing, and eligibility. They are separate from the explicitly labeled sample roles. Great match ranks interests and geography; it does not assess eligibility or apply automatically.

The signup is a browser-local demo, not authentication. No passwords are collected. Returning users on the same browser skip account setup. Monitor is hidden; former Prepare/Upload links open Workshop and the old Apply link opens Track.

Entries, mock account details, and extracted document text are stored in this browser's local storage. New document uploads are saved as original files in IndexedDB for later download. Nothing is uploaded to a document service. They do not sync between devices. Clearing site data removes entries and files. Earlier uploads made before Workshop was added retain their text; reupload to save the original file. Do not put API keys in the React application or `VITE_*` variables: client assets are public.

Discover includes firm-sourced local program listings alongside clearly marked sample positions. Copilot and Auto create local preparation or queue records; no external applications are filled or submitted. Existing records are preserved and bulk queues deduplicate positions. Calendar dates/times use the browser's local timezone. Application history updates with user actions; no external monitoring runs in the background.

Workshop AI buttons are explicitly labeled demos: document review uses local checks, and letter generation combines saved text with supplied events and contacts. No claims of live AI generation are made.

GitHub Pages cannot run Python, SQLite, server-side AI requests, or scheduled recruiting collection. AI generation and automated monitoring need a separately hosted backend. The hosted UI labels its manual alternatives explicitly. No application submission is automated.

The original Flask application remains available via `START_MAC.command`; see `README_START_HERE.md` for its separate setup. Its SQLite records and local uploads are not migrated or published by the Pages workflow.

## Dependency note

Vite 5 is retained to match the requested build tools. npm audit reports development-server advisories that require a newer Vite major to resolve. The deployed Pages site consists only of static build output and does not run the Vite development server. Keep local preview and development servers restricted to localhost.
