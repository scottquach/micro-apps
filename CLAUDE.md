# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A web utility that captures screenshots of localhost URLs via Puppeteer and wraps them in polished promotional frames (gradient backgrounds, browser chrome mockup, title/subtitle text) for social media sharing. Produces downloadable PNGs without needing design tools.

## Commands

```bash
npm start          # Start Express server on http://localhost:3001
npm install        # Install dependencies (express, puppeteer)
```

No test framework, linter, or build step is configured.

## Architecture

```
Browser (localhost:3001)
├── Left panel: Live preview <canvas>
└── Right panel: Controls sidebar
        │
        ▼  POST /api/screenshot { url, width?, height? }
Express Server (server.js)
        │
        ▼  Puppeteer headless Chrome
Returns base64 PNG → loaded into canvas
```

**Backend** (`server.js`): Express server with a single `POST /api/screenshot` endpoint. Launches a Puppeteer browser per request, captures a screenshot, returns base64 PNG. No persistence or database.

**Frontend** (all in `public/`, served as static files):
- `index.html` — Two-panel layout: canvas preview (left ~70%) + controls sidebar (right 340px fixed)
- `style.css` — Dark theme (#0f0f0f body), accent color #667eea
- `app.js` — All client logic: canvas rendering engine, state management, event binding, API calls, PNG download

**Rendering pipeline** (`app.js`): A global `state` object drives a `render()` function that redraws the full canvas on every state change. Draw order: background → title text → browser frame (with shadow, title bar, traffic lights, address bar, screenshot content) → subtitle text. All composition is done client-side on Canvas; the server only provides raw screenshots.

**Key patterns**:
- Every UI control updates `state` then calls `render()` — there's no diffing or partial updates
- Browser frame uses `ctx.save()/clip()/restore()` for rounded corners
- Screenshot is drawn with aspect-ratio "cover" scaling inside the browser content area
- 8 hardcoded gradient presets in `GRADIENT_PRESETS` array
- Font sizes defined as S/M/L presets in `FONT_SIZES` mapping to title/subtitle px values
