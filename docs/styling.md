# Styling Guide

## File layout

| File | Purpose |
|------|---------|
| `common/index.css` | Design tokens, resets, shared component classes, directory page styles |
| `<app>/<app>.html` | App-specific styles inline in a `<style>` block |

Sub-apps live one level deep, so the CSS link must be `../common/index.css`.

---

## Design tokens

All tokens are CSS custom properties defined in `common/index.css`. Dark mode is the default; light mode is opt-in via `class="light"` on `<html>`. See the file for exact values — use tokens, never raw hex.

| Token | Role |
|-------|------|
| `--bg` | Page background |
| `--surface` / `--surface2` / `--surface3` | Panel bg / elevated (headers) / hover |
| `--border` / `--border2` | Structural borders / input borders |
| `--text` / `--text-dim` / `--text-muted` | Primary / secondary / labels & hints |
| `--accent` / `--accent-dim` | Gold highlight / accent backgrounds |
| `--error` / `--success` | Error and success states |
| `--font-ui` / `--font-mono` | UI typeface / monospace |
| `--r` | Border radius for controls and cards |
| `--t` | Transition duration |

---

## Shared component classes

Defined in `common/index.css`. App-specific layout stays inline in each file's `<style>` block.

**`.panel`** — Flex column, `overflow: hidden`, `min-width: 0`. Use on every major panel section.

**`.ph`** — 30 px panel header bar (`--surface2` bg, bottom border). Title on the left, optional action on the right. Override `text-transform`/`letter-spacing`/`font-size` inline when the default all-caps label style doesn't fit.

**`.btn` / `.btn-hi`** — Ghost button (`--border2` border, transparent bg). `.btn-hi` is the accent variant for the primary action.

**`.isel`** — Styled `<select>`. Set `option { background: var(--surface2) }` so the dropdown matches in both modes.

**`.app-info`** — 228 px left sidebar used in every utility app. No background — inherits page bg for a minimal look. Separated from app content by the inner container's `border-left`. Sub-elements: `.app-info-back` (home link), `.app-info-name` + `.app-info-mark` (identity), `.app-info-desc` (description), `.app-info-sep` (rule), `.app-info-hints` (usage tips list).

---

## Layout pattern

```
[sidebar 228px] | [app container — centered, max-width 1600px]
                     ┌──────────────┬──────────────────────┐
                     │ .ph          │ .ph                   │
                     ├──────────────┼──────────────────────┤
                     │ input-panel  │ main-panel            │
                     └──────────────┴──────────────────────┘
```

- `body` is the top-level grid: `228px minmax(0, 1fr)`. `.app-info` sits in column 1, the app container in column 2.
- The app container uses `justify-self: center` so it centers within its column on wide displays.
- No global header — identity lives in the `.app-info` sidebar.
- App-specific layout (panel columns, status bars, etc.) is scoped to each file.

---

## Conventions

- **Light mode** — all current utility apps use `class="light"` on `<html>`.
- **Inputs** — `background: transparent`; borders from `--border2`; accent focus ring: `border-color: rgba(196,150,78,0.5)` on `:focus`.
- **Monospace** — timestamps, code values, and raw input always use `--font-mono`.
- **Labels** — `10px`, `700`, `text-transform: uppercase`, `letter-spacing: 0.1em`, `color: var(--text-muted)`.

---

## New micro app checklist

Copy the structure from an existing app (e.g. `base64-codec/base64-codec.html`) and update:

- [ ] `class="light"` on `<html>`
- [ ] `../common/index.css` linked
- [ ] `body` grid: `228px minmax(0, 1fr)`
- [ ] `.app-info` sidebar with back link, mark, name, description, sep, hints
- [ ] App container: `max-width: 1600px; justify-self: center; border-left/right`
- [ ] `.ph { height: 30px }` override in local styles
- [ ] All inputs have accent focus ring
- [ ] Labels follow the label convention above
- [ ] Mobile breakpoint: `body { display: block }`, `.app-info { display: none }`, app grid collapses to `1fr`
- [ ] App registered in `index.html` `apps` array
