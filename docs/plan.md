# Social Share Utility — Implementation Plan

## Context

A web utility that lets you paste a localhost URL, capture a screenshot via Puppeteer, and wrap it in a polished promotional frame (gradient background, browser mockup, title/subtitle text) for sharing on social media. Produces professional-looking promotional images without needing Figma or Photoshop.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (single-page app)
- **Backend**: Node.js + Express (serves static files + screenshot API)
- **Screenshot**: Puppeteer (headless Chrome)
- **Image composition**: HTML5 Canvas (client-side)

## Architecture

```
Browser (localhost:3001)
├── Left panel: Live preview <canvas>
└── Right panel: Controls sidebar
        │
        ▼  POST /api/screenshot { url }
Express Server (server.js)
        │
        ▼  Puppeteer headless Chrome
Returns base64 PNG → loaded into canvas
```

All styling/composition is done client-side on Canvas. The backend only captures the raw screenshot.

## Files to Create

| File | Purpose | ~Lines |
|------|---------|--------|
| `package.json` | Dependencies (express, puppeteer), scripts | ~15 |
| `server.js` | Express server + `POST /api/screenshot` endpoint | ~60 |
| `public/index.html` | Single-page HTML with all UI controls | ~120 |
| `public/style.css` | Dark theme, two-panel layout, controls styling | ~180 |
| `public/app.js` | Canvas rendering engine, event handling, API calls, download | ~400 |

---

## Implementation Tasks

Tasks are organized for parallel execution where possible. Dependencies are noted.

### Task 1: Project Setup (Sequential — must run first)

**Description**: Initialize the project with package.json and install dependencies.

- Create `package.json` with express and puppeteer dependencies
- Run `npm install`
- Create `public/` directory

**Blocks**: Tasks 2, 3, 4, 5

---

### Task 2: Backend Server (`server.js`)

**Description**: Build the Express server with static file serving and the Puppeteer screenshot API endpoint.

**Can run in parallel with**: Tasks 3, 4, 5 (after Task 1)

**Details**:
- Express server on port 3001
- `POST /api/screenshot` endpoint
  - Request body: `{ url: string, width?: number, height?: number }`
  - Puppeteer: `headless: true`, `waitUntil: 'networkidle0'`, 15s timeout
  - Returns `{ success: true, image: "<base64>", width, height }`
  - Error handling: URL validation, try/catch with browser cleanup
- Serve `public/` as static files

---

### Task 3: Frontend HTML Structure (`public/index.html`)

**Description**: Build the complete single-page HTML with all UI controls and layout containers.

**Can run in parallel with**: Tasks 2, 4, 5 (after Task 1)

**Details**:
- Two-panel layout: `.preview-panel` (left, ~70%) + `.controls-panel` (right, ~30%)
- Left panel: `<canvas id="preview-canvas">`
- Right panel sections (top to bottom):
  1. App title
  2. URL input + "Capture" button + status text
  3. Size preset buttons: Twitter (1200x675), Instagram (1080x1080), LinkedIn (1200x627), Custom (with hidden dimension inputs)
  4. Background: gradient swatch container + custom color pickers + solid/gradient mode dropdown
  5. Browser frame: theme dropdown (dark/light)
  6. Text: title input, subtitle input, color picker, font size toggle (S/M/L)
  7. Styling: padding slider (20–120), corner radius slider (0–24), shadow checkbox
  8. Download PNG button
- Google Fonts: Inter (400, 500, 600, 700)

---

### Task 4: Frontend CSS (`public/style.css`)

**Description**: Style the entire app with a dark theme, two-panel layout, and polished controls.

**Can run in parallel with**: Tasks 2, 3, 5 (after Task 1)

**Details**:
- Dark theme: body `#0f0f0f`, preview `#1a1a1a`, sidebar `#141414`
- Flexbox two-panel layout, controls panel fixed at 340px width
- Canvas scales via `max-width: 100%; max-height: 100%` inside flexbox-centered container
- Controls: dark inputs (`#222` bg, `#333` border), accent color `#667eea`
- Gradient swatches: 4-column grid, `aspect-ratio: 1`, active border
- Preset buttons: pill style, active state matches accent
- Size toggle buttons: small 32x28px pills
- Download button: green (`#22c55e`), full width, bold
- Slider accent color via `accent-color: #667eea`
- Utility classes: `.hidden`, `.status-text`, `.error`, `.success`

---

### Task 5: Frontend JavaScript (`public/app.js`)

**Description**: Core canvas rendering engine, all drawing functions, event handling, API communication, and download functionality. This is the largest and most complex task.

**Can run in parallel with**: Tasks 2, 3, 4 (after Task 1)
**Note**: This task could optionally be split into sub-tasks (5a–5d below) but they share the state object so sequential execution within a single agent is recommended.

**Details**:

#### 5a. State & Constants
- `state` object: screenshotImage, screenshotURL, canvasWidth/Height, bgColor1/2, bgMode, frameTheme, titleText, subtitleText, textColor, textSize, padding, cornerRadius, shadowEnabled
- `GRADIENT_PRESETS` (8 entries): Purple Haze (#667eea → #764ba2), Sunset Burn (#f093fb → #f5576c), Ocean Breeze (#4facfe → #00f2fe), Warm Flame (#ff9a9e → #fad0c4), Night Fade (#a18cd1 → #fbc2eb), Teal Dream (#0fd850 → #f9f047), Peach Glow (#ffecd2 → #fcb69f), Deep Space (#6a11cb → #2575fc)
- `FONT_SIZES`: S (28/18), M (36/22), L (48/28)

#### 5b. Canvas Rendering Engine

Draw order (back → front):

1. **`drawBackground(ctx)`** — Solid fill or diagonal linear gradient (top-left → bottom-right)
2. **`drawTitle(ctx)`** — Bold 700 text, centered, at `padding` from top. Returns Y of bottom edge.
3. **`drawBrowserFrame(ctx, startY)`** — The complex one:
   - Calculate frame bounds: `x = padding`, `y = startY`, `w = canvasWidth - 2*padding`, `h` fills remaining space minus subtitle reserve
   - Drop shadow (if enabled): `shadowBlur: 40`, `offsetY: 12`, `rgba(0,0,0,0.35)` on a rounded rect
   - Clip to rounded rect for entire frame
   - Title bar (40px): fill with theme color (#2d2d2d dark / #e8e8e8 light), 1px bottom border
   - Traffic lights: 3 circles at radius 6, gap 20px, starting 16px from left. Colors: #ff5f57, #ffbd2e, #28c840
   - Address bar: centered pill, max 360px or 45% of frame width, contains truncated URL text
   - Content area: filled with theme bg, then screenshot drawn with aspect-ratio "cover" scaling, or placeholder text if no screenshot
4. **`drawSubtitle(ctx)`** — Normal 400 text, centered, 12px below frame bottom

Helper functions:
- `drawRoundedRect(ctx, x, y, w, h, r)` — Path only (beginPath → closePath), no fill/stroke
- `truncateText(ctx, text, maxWidth)` — Measures text, truncates with "..." if needed

#### 5c. Controls & Event Handling

`init()` on DOMContentLoaded:
- `initGradientSwatches()` — Creates 8 swatch divs with CSS gradient backgrounds, click handlers update state + render
- `bindControls()` — Wires all event listeners:
  - Capture button → `captureScreenshot()`
  - Preset buttons → update canvasWidth/Height, toggle Custom inputs visibility
  - Custom size inputs → update dimensions on input
  - Color pickers → update bgColor1/2, clear active swatch
  - Background mode dropdown → update bgMode
  - Frame theme dropdown → update frameTheme
  - Text inputs → update titleText/subtitleText
  - Text color picker → update textColor
  - Size toggle buttons → update textSize
  - Padding/radius sliders → update values + display span
  - Shadow checkbox → update shadowEnabled
  - All handlers call `render()` after state update

#### 5d. API Integration & Download

- `captureScreenshot()`: POST to `/api/screenshot`, loading state on button, load base64 into `new Image()`, set `state.screenshotImage`, call `render()`
- `downloadImage()`: `canvas.toDataURL('image/png')`, create temp `<a>` with download attribute, click, remove

---

## Parallel Agent Assignment

```
                    ┌─────────────────┐
                    │  Task 1: Setup  │
                    │  (sequential)   │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                 ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Agent A:    │  │  Agent B:    │  │  Agent C:    │
   │  Backend     │  │  HTML + CSS  │  │  Frontend JS │
   │  (Task 2)    │  │  (Tasks 3+4) │  │  (Task 5)   │
   └─────────────┘  └──────────────┘  └──────────────┘
```

- **Agent A** handles `server.js` — small, self-contained, no frontend dependencies
- **Agent B** handles `index.html` + `style.css` — these are tightly coupled (HTML structure dictates CSS selectors) so one agent is better
- **Agent C** handles `app.js` — the largest task, benefits from a dedicated agent with full context of the rendering engine

After all agents complete, a final integration pass verifies everything works together.

---

## Verification

1. `npm start` → server runs on port 3001
2. Open `http://localhost:3001` → two-panel layout renders with default gradient + browser frame placeholder
3. Click gradient swatches → background updates live
4. Select size presets → canvas aspect ratio changes
5. Start a local app, enter URL, click Capture → screenshot appears in browser frame
6. Add title/subtitle → text renders above/below frame
7. Adjust padding, radius, shadow → frame styling updates live
8. Click Download PNG → file downloads at correct resolution with all elements
