# NR Presentation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Canva / Google-Slides-style presentation editor for the web — React + Konva on the front, a .NET 10 + PostgreSQL API on the back. Build slides with real design tooling (charts, tables, icons, animations), present with speaker view, export to PNG/PDF/PowerPoint, and share read-only links with cloud accounts.

## Features

### Editor
- **Canvas** — drag, resize, rotate, multi-select marquee, grouping, locking, layers panel, smart snapping + guides, grid & rulers, zoom/pan
- **Elements** — text, 9 shapes, lines/arrows, images (crop presets, filters, corner radius), charts (single-series bar/line/pie/donut/area), tables, 96 icons, 28 decorative graphics, 56 emoji
- **22 slide templates + 5 full deck templates** (pitch deck, QBR, lesson, marketing plan, portfolio) with search
- **20 color palettes** — harmony-based generator with one-click apply
- **Animations & transitions** — per-element entrances, per-slide transitions, presenter timers
- **Project-level undo/redo**, clipboard (in-app + system mirror), duplicate, find (Ctrl+F)
- **Custom slide sizes** — 16:9, 4:3, 1:1, 9:16, A4 or custom; content rescales automatically
- **Sections** — collapsible groups in the slide rail, rename, bulk-assign
- **Brand kit** — save palette colors + fonts to the project, apply with one click
- **Speaker notes** on every slide

### Present mode
- Fullscreen presenting, next-slide preview, elapsed timer
- **Laser pointer (L)**, **overview grid (O)**, **speaker notes (N)**, keyboard navigation

### Export
- PNG (current slide / all slides), PDF, PDF + speaker-notes handout
- **PowerPoint (.pptx)** via pptxgenjs, notes preserved
- JSON export/import (project files)

### Cloud (optional)
- **Accounts** — register/login with PBKDF2 password hashing and HttpOnly cookie sessions
- **Per-user projects** — autosaved to PostgreSQL; legacy anonymous projects are adopted by the first account
- **Image assets** — inline images are uploaded to the server on save (`/api/assets/{id}`)
- **Share links** — per-project read-only links (`/?view=TOKEN`) with a dedicated public viewer

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Konva (react-konva), Zustand |
| Exports | jsPDF, pptxgenjs, native canvas |
| Backend | .NET 10 (ASP.NET Core Minimal API), Entity Framework Core |
| Database | PostgreSQL 18 |
| Lint | oxlint (strict React Compiler rules) |

## Prerequisites

- Node.js 20+ and npm
- .NET SDK **10.0**
- PostgreSQL 14+ (tested on 18)

## Setup

### 1. Database

Create a database (it will also be auto-created by the API if missing):

```sql
CREATE DATABASE nr_presentation;
```

### 2. Backend

The Postgres password is **never** stored in git. Provide it via an environment variable:

```powershell
# PowerShell
$env:POSTGRES_PASSWORD = "your-password"
dotnet run --project backend/NR.Presentation.Api --no-launch-profile --urls http://localhost:5210
```

```bash
# bash
export POSTGRES_PASSWORD=your-password
dotnet run --project backend/NR.Presentation.Api --no-launch-profile --urls http://localhost:5210
```

Alternatively set the full connection string via standard ASP.NET config:
`ConnectionStrings__Postgres="Host=...;Username=...;Password=...;Database=nr_presentation"`

API listens on **http://localhost:5210** (`/api/health` to verify).

### 3. Frontend

```bash
npm install
echo "VITE_API_URL=http://localhost:5210/api" > .env.local
npm run dev
```

Editor runs on **http://localhost:5174** (5173 is reserved elsewhere; don't change without editing `vite.config.ts`).

> Without `VITE_API_URL` the app runs in **local mode** — projects live in the browser's localStorage, no account needed.

### 4. Sign in

Open the app, choose **Create account**, or use the seeded demo:

- Email: `demo@nr.test`
- Password: `secret123`

(Only exists if the dev database was seeded — otherwise register your own; the first account adopts any existing anonymous projects.)

## Keyboard shortcuts

Press **F1** in the app for the full cheat sheet.

| Keys | Action |
| --- | --- |
| `V T R O L A I H` | Tools (select, text, shapes, line, arrow, image, hand) |
| `Ctrl+Z / Ctrl+Y` | Undo / redo |
| `Ctrl+C / X / V` | Copy / cut / paste |
| `Ctrl+D / Ctrl+A / Ctrl+G` | Duplicate / select all / group |
| `Ctrl+F` | Find in presentation |
| `Ctrl+S` | Save now |
| `Ctrl + / − / 0` | Zoom in / out / reset |
| `F5` | Present |
| `→ ← Space` | Present: next / previous slide |
| `L / O / N / T` | Present: laser / overview / notes / timer |
| `Esc` | Clear selection / exit |

## Project structure

```
src/
  components/
    canvas/          # Konva stage, elements, present mode, rulers
    panels/          # Projects, layers, templates, elements, palette
    common/          # ColorField, NumberField
    *.tsx            # Toolbar, slide rail, properties sidebar, overlays
  data/              # Templates, deck templates, icons, graphics, fonts
  persistence/       # ProjectApi (local + REST), authApi
  store/             # Zustand stores (editor, canvas UI, auth)
  types/             # Editor data model
  utils/             # Export, snap, chart/table drawing, palettes
backend/NR.Presentation.Api/
  Auth/              # PBKDF2 hasher, session cookie, auth endpoints
  Data/              # EF Core DbContext, schema migrator, bootstrapper
  ProjectEndpoints.cs, AssetEndpoints.cs, Program.cs
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on :5174 |
| `npm run build` | Type-check + production build |
| `npm run lint` | oxlint |
| `dotnet build backend/NR.Presentation.slnx` | Build the API |

## Notes

- Uploaded image assets are stored under `backend/NR.Presentation.Api/storage/assets/` (git-ignored).
- Schema changes on an existing database are applied by `SchemaMigrator` (idempotent `IF NOT EXISTS` SQL) on startup.
- Share links are read-only; opening one and choosing **Sign in to edit** copies the deck into your own account.
