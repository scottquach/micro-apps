A collection of small micro apps useful for everyday app development. Feel free to submit your own! I try to keep each micro app as a pure HTML file to keep things simple.

- `index.html` - shell page for selecting and embedding the micro apps
- `privacy.html` - public privacy page and analytics opt-out controls
- `common/site-config.js` - deploy-time feature config for analytics
- `common/analytics.js` - shared PostHog loader with autocapture and session replay disabled
- `apps/` - individual micro app folders
  - `promotion-mockup/` - promotional image mockup utility
  - `timestamp-converter/` - paste one or many timestamps and convert them across UTC, local, selected timezones, RFC, and Unix formats
  - `json-parser/` - format, validate, inspect, and transform JSON
  - `base64-codec/` - encode and decode Base64, URL-safe Base64, and Unicode text
  - `color-toolkit/` - convert colors, generate tints and shades, check contrast, and copy CSS variables

## Analytics

PostHog is wired through `common/analytics.js`, but analytics are disabled by default in `common/site-config.js`. To enable analytics for a deployment, set `analytics.enabled` to `true`, replace the `phc_` project token, and optionally restrict `allowedHosts`.

The shared loader only captures page/app lifecycle events. It disables PostHog autocapture and session recording so pasted tool content, uploaded files, and generated outputs are not collected.
