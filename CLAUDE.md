# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start everything (Express + Vite dev server on port 3000)
npm run build    # Vite production build → dist/
npm run lint     # TypeScript type-check only (tsc --noEmit, no test suite exists)
```

There is no separate frontend dev server — `npm run dev` runs `tsx server.ts`, which boots Express and mounts Vite as middleware in dev mode (see `startServer()` in `server.ts`). Everything is on **port 3000**.

## Environment

Create a `.env` file (already in `.gitignore`) with:
```
GEMINI_API_KEY=your_key_here
JWT_SECRET=some-secret
```
Get a Gemini key at https://aistudio.google.com/app/apikey. **Never hardcode keys in source files** — the previous key was revoked by Google for being committed to git.

## Architecture

This is a **single-process fullstack app**: one `tsx server.ts` process serves both the REST API (Express) and the React SPA (Vite middleware).

### Request Flow
1. Browser → `localhost:3000`
2. Express routes handle `/api/*` paths
3. Vite middleware handles everything else (serves React SPA)
4. React SPA calls back to `/api/*` for AI processing and auth

### AI Processing Pipeline (`/api/process-chunk`)
Files are chunked client-side in `services/geminiService.ts` (`CHUNK_SIZE = 3` files per chunk). Each chunk is POSTed to `/api/process-chunk` which calls the Gemini API. The server uses a **model cascade** — it tries models in order until one succeeds:
1. `gemini-2.5-pro-preview-05-06`
2. `gemini-2.5-flash-preview-05-20`
3. `gemini-2.0-flash`
4. `gemini-1.5-pro`
5. `gemini-1.5-flash`

A 403 on one model moves to the next — only a genuine `401`/`invalid api key` response halts the cascade. Rate limits (429) retry the same model with backoff.

### API Key Priority
Server: `x-api-key` request header (user's custom key from Settings) → `GEMINI_API_KEY` env var
Client Settings modal stores a custom key in `localStorage` under `gemini_api_key` and sends it as the `x-api-key` header.

### State & Storage
- **Study units** (metadata + AI-generated content): `localStorage` key `academic-grip-data-v4`
- **Uploaded files** (raw blobs): IndexedDB via `idb` — see `services/storage.ts`. Key format: `${unitId}_${fileIndex}`
- **Auth token + user**: `localStorage` keys `token` and `user`
- **Server-side**: uploaded files written to `data/uploads/`, user accounts in `data/users.json`, file metadata in `data/files.json`

### Data Model
The core type is `StudyGuide` (`types.ts`): `detailedPageNotes[]`, `quiz[]`, `flashcards[]`, `conceptMap[]`, `feynmanExplanation`, `audioScript`, `confidence`. A `Unit` wraps a `StudyGuide` with id/title/timestamps. Units are the top-level user-facing concept (like a course or subject).

### Tailwind
Loaded via CDN `<script>` in `index.html` (not via PostCSS/build). `index.css` uses `@tailwind` directives — these work in dev via Vite's CSS processing but the CDN script provides the runtime in the browser. Custom utility classes (`animate-fade-in`, `custom-scrollbar`, `btn-primary`, `btn-secondary`) are defined in `index.css`.

### PDF Processing
`services/fileProcessor.ts` extracts text from PDFs using `pdfjs-dist` before sending to the AI (cheaper than sending raw binary). The worker is loaded from jsDelivr CDN matching the installed version. Falls back to raw base64 upload if text extraction fails.
