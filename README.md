# NR Presentation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## About

**NR Presentation** is a full-stack Canva & Google Slides alternative built with **React 19**, **TypeScript**, **Konva**, **.NET 10**, and **PostgreSQL**. It combines rich visual design tooling—curved text, neon/hollow/splice text effects, shape masks, laptop/phone/browser device mockups, freehand brushes, native charts, tables, and video/audio embeds—with AI-assisted slide generation (**Magic Studio**), real-time multi-tab collaboration & slide comments, fullscreen presenter view with laser pointer & speaker notes, and one-click export to PNG, PDF, and PowerPoint (`.pptx`).

## Features

### Editor
- **Canvas** — drag, resize, rotate, multi-select marquee, grouping, locking, layers panel, smart snapping + guides, grid & rulers, zoom/pan
- **Elements** — text, 9 shapes, lines/arrows, freehand brush strokes, images (crop presets, filters, corner radius, shape masks & device frames), video & audio embeds, charts (single-series bar/line/pie/donut/area), tables, 96 icons, 28 decorative graphics, 56 emoji
- **Curved Text & Text Effects** — circular arc text (`-180°` to `+180°`), Canva-style text effects (`Neon`, `Hollow`, `Splice`, `Echo`, `Lift`), and custom text outlines
- **Image Frames & Device Mockups** — mask any image into shape frames (`Circle`, `Arch`, `Diamond`, `Triangle`, `Hexagon`, `Star`, `Heart`) or device mockups (`Laptop`, `Phone`, `Browser`)
- **Video & Audio Media** — embed MP4/WebM/YouTube videos and audio tracks (including built-in synthesized WAV tracks) with live playback in both the editor and Present Mode
- **Freehand Draw / Pen Tool (`B` / `P`)** — draw smooth freehand strokes directly on slides with `Pen`, `Marker`, and `Highlighter` brushes
- **AI Magic Studio (`✨`)** — **Magic Design** generates tailored 5-slide decks or single slides from any prompt and visual theme; **Magic Write** rewrites selected text (punchy headline, executive polish, expand, shorten, bulletize, or translate)
- **Real-Time Collaboration & Comments (`💬`)** — pin comment badges to slides, reply/resolve threads, and sync live collaborator cursors and slide edits across browser tabs/windows in real time
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

(Only exists if the dev database was seeded — otherwise register your own, or click **⚡ Continue in Local Studio Mode** on the sign-in screen to use the full editor offline without PostgreSQL.)

## Keyboard shortcuts

Press **F1** in the app for the full cheat sheet.

| Keys | Action |
| --- | --- |
| `V T B R O L A I H` | Tools (select, text, draw/pen, shapes, line, arrow, image, hand) |
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
    canvas/          # Konva stage, elements, media overlay, present mode, rulers
    panels/          # Projects, layers, templates, elements, palette, magic AI, comments
    common/          # ColorField, NumberField
    *.tsx            # Toolbar, slide rail, properties sidebar, overlays
  data/              # Templates, deck templates, icons, graphics, fonts
  hooks/             # Keyboard shortcuts, real-time BroadcastChannel collaboration
  persistence/       # ProjectApi (local + REST), authApi
  store/             # Zustand stores (editor, canvas UI, auth)
  types/             # Editor data model
  utils/             # Export, snap, chart/table drawing, text effects, image masks, media, palettes
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
