---
name: new-micro-app
description: Scaffolds a new micro app in this repo — a self-contained HTML file under apps/<name>/, wired to shared styles/scripts and registered on the home page. Use when the user asks to add, create, scaffold, or onboard a new micro app/utility into this site.
---

# New Micro App

## Quick start

1. Pick identity: `id`, `icon`, `tag`, `name`, `description`.
2. Create `apps/<id>/<id>.html` by copying the boilerplate from an existing app (see step 2).
3. Strip the app-specific `<style>`/`<script>` content, build the new app's panels and logic.
4. Add an entry to the `apps` array in root `index.html`.
5. Verify against `docs/styling.md`'s checklist and smoke-test in a browser.

## Workflow

### 1. Choose identity

- `id` — short lowercase slug, unique, used as the card's dataset key (e.g. `base64`).
- `icon` — emoji or a 1–3 char mark (e.g. `64`, `#`).
- `tag` — an existing category (`Design`, `Utility`, `Dev`) or a new one; categories on the home page are derived automatically from whatever tags exist, no separate place to register one.
- `name` / `description` — shown on the home page card and in the app's `.app-info` sidebar.
- Filename: use kebab-case matching the folder, e.g. `apps/base64-codec/base64-codec.html`. Two older apps use snake_case (`promotion_mockup.html`, `timestamp_converter.html`) — don't follow that, it's legacy.

### 2. Scaffold the file

Copy the structure of `apps/base64-codec/base64-codec.html` (simplest two-panel example) into `apps/<id>/<id>.html`. Keep these pieces intact — they're the shared contract, not boilerplate to throw away:

- `<html lang="en" class="light">` and `<link rel="stylesheet" href="../../common/index.css">`
- `<script src="../../common/site-config.js" defer>` and `.../analytics.js` — keep these even though the files aren't in this repo; they're injected at deploy (see the `cloudflare/workers-autoconfig` branch).
- The `.app-info` sidebar (`.app-info-back`, `.app-info-name` + `.app-info-mark`, `.app-info-desc`, `.app-info-sep`, `.app-info-hints`).
- `body` grid `228px minmax(0, 1fr)`; app container centered, `max-width: 1600px`, `border-left`/`border-right`.
- Panel Frame pattern: every panel is `.panel` with a `.ph` header as its first child — no global `<header>` element on the page.

Then replace the app-specific `<style>` rules and `<script>` logic with the new app's own.

### 3. Register on the home page

Add one object to the `apps` array in root `index.html` (near the top of the inline `<script>`):

```js
{ id: "<id>", icon: "<icon>", tag: "<tag>", name: "<Name>", path: "apps/<id>/<id>.html", description: "<description>" }
```

That's the only place app listing/filtering reads from — no other manifest to touch.

### 4. Verify against the styling checklist

Run every item in [docs/styling.md](../../../docs/styling.md) under "New micro app checklist" — it's the source of truth for tokens, breakpoints, and spacing details, and may drift from this skill over time.

### 5. Smoke test

Open root `index.html` in a browser: confirm the new card renders and the tag filter includes it, click into the app, then resize below 860px to check the mobile breakpoint (`.app-info` hides, layout collapses to one column).
