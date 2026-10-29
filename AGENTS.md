# AGENTS.md

Static site served by GitHub Pages at **https://simson.io/tools/**. No build step, no package.json, no framework.

```
index.html            outer chrome: landing grid, search palette, tool view (iframe). Rarely changes.
tools.json            registry of all tools; the chrome renders only from this file.
scripts/check-tools.mjs   validates tools.json, syncs the README tool list (node, no deps)
<slug>/index.html     one self-contained tool per folder
<slug>/screenshot.png optional preview image
<slug>/README.md      optional short description (shown on GitHub)
```

Routing: `simson.io/tools/<slug>/` is the tool on its own; `simson.io/tools/#<slug>` is the same tool inside the chrome (iframe + sidebar). Order in `tools.json` = display order and the `1`–`9` shortcuts, so append new tools at the end unless asked otherwise.

## Adding a tool (the usual task)

You almost never need to read or touch `index.html`. Do this:

1. **Local tool**: create `<slug>/index.html` (kebab-case slug, single file, see "Tool rules"). Skip for tools hosted elsewhere.
2. **Register it**: append an entry to `tools.json`.
3. **Optional**: add `<slug>/screenshot.png` (16:10, ~1280×800, top of the UI is what shows in cards) and a 2–4 line `<slug>/README.md`.
4. **Check**: `node scripts/check-tools.mjs --fix`. Validates `tools.json` and regenerates the tool list in `README.md` (between the `<!-- tools:… -->` markers; don't edit it by hand). Without `--fix` it fails if the list is stale.

### `tools.json` entry

```json
{
  "slug": "json-formatter",
  "name": "JSON Formatter",
  "description": "One sentence, what it does. Shown on cards and in search.",
  "tags": ["data", "json", "format"],
  "keywords": ["pretty", "minify", "validate"],
  "screenshot": "json-formatter/screenshot.png",
  "added": "2026-10-29"
}
```

| field | required | notes |
|---|---|---|
| `slug` | yes | kebab-case, unique. Folder name for local tools; also the `#hash` in the chrome. |
| `name` | yes | Title-case display name. |
| `description` | yes | One or two sentences, no trailing marketing. |
| `tags` | yes | Lowercase, no `#`. Reuse existing tags where they fit (`images`, `png`, `data`, `csv`, `convert`, …); they power the tag cloud and `#tag` search. 2–5 tags. |
| `keywords` | no | Extra search-only terms (synonyms, file extensions). Not displayed. |
| `url` | no | **Omit for tools in this repo** (defaults to `./<slug>/`). Set to an absolute `https://` URL for a tool hosted elsewhere; then no folder is needed. |
| `screenshot` | no | Repo-relative path or absolute URL. Without it a neutral placeholder is shown. |
| `embed` | no | Default `true`. Set `false` if the tool can't run in an iframe (external site sends `X-Frame-Options`/CSP `frame-ancestors`, needs top-level navigation, OAuth popups, etc.). The chrome then shows an "open in new tab" button instead. |
| `source` | no | Link to source code. Defaults to the GitHub folder for local tools. |
| `added` | no | `YYYY-MM-DD`. |

External tool example, nothing else to add to the repo:

```json
{
  "slug": "some-hosted-tool",
  "name": "Some Hosted Tool",
  "description": "What it does.",
  "tags": ["text"],
  "url": "https://example.com/tool/",
  "screenshot": "https://example.com/tool/preview.png",
  "embed": false
}
```

## Tool rules

- **Self-contained single `index.html`.** Inline CSS/JS. Libraries from a CDN with a pinned version (cdnjs preferred, e.g. `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js`). Never `@latest`. No build step.
- **Client-side only.** No servers, no API keys; files the user drops stay in the browser.
- **Works standalone and inside the iframe.** Don't use `window.top`/`parent`, don't add a site header, "back to tools" link or nav: the chrome provides those. Downloads via `<a download>`/Blob and the clipboard API work in the iframe.
- **Keyboard**: the chrome uses `, . b c o h / 1-9 Esc` and `⌘/Ctrl+P`/`K`, but only while focus is in the chrome, so tools may use any keys. If a tool adds shortcuts, match on `e.key` (not `e.code`), ignore events with `altKey` (AltGr on Windows is ctrl+alt), and pick keys typed without AltGr/Option on a German QWERTZ layout (so no `[ ] { } \ | @ ~`).
- **Responsive** down to 390 px width, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>` = the tool's `name`.

## Common styling

Tools may have their own look, but new ones should default to the site's style so they sit well inside the chrome. Paste this as a starting point and build on it:

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #333333;        /* body text */
  --muted: #666666;      /* secondary text (passes AA on white) */
  --faint: #767676;      /* labels, hints (min. grey on white) */
  --line: #E8E8E8;       /* borders, dividers */
  --line-strong: #D6D6D6;/* input borders */
  --bg: #FFFFFF;
  --soft: #FAFAFA;       /* inputs, kbd, subtle panels */
  --accent: #DC3522;     /* simson.io red: links, focus, primary buttons */
  --accent-ink: #B32A1A; /* red text on light bg, hover */
  --accent-bg: #FCEFED;  /* selected/active background */
  --radius: 6px;
  --sans: 'Roboto', system-ui, sans-serif;
  --mono: 'Roboto Mono', ui-monospace, monospace;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 300 16px/1.5 var(--sans); }
h1, h2 { font-weight: 300; margin: 0; }            /* headings are light, not bold */
a { color: var(--accent-ink); }
.card { border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; }
.btn { height: 44px; padding: 0 16px; border: 1px solid var(--line-strong); border-radius: var(--radius);
       background: var(--soft); color: var(--ink); font: inherit; font-weight: 400; cursor: pointer; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn.primary:hover { background: var(--accent-ink); }
input, select, textarea { font: inherit; border: 1px solid var(--line-strong); border-radius: var(--radius);
       background: var(--soft); padding: 8px 10px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
code, kbd { font-family: var(--mono); }
</style>
```

Style principles: white ground, light (300) Roboto, thin 1 px grey lines, one red accent used sparingly, 6 px radii, no gradients/glows/emoji-as-icons, inline stroke SVG icons, touch targets ≥ 44 px.

## Running locally

`tools.json` is loaded with `fetch`, so serve over HTTP rather than opening the file:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/ (chrome) or http://localhost:8000/<slug>/ (tool alone).

## Changing the chrome (rare)

Only when explicitly asked. Everything is in `index.html`: CSS tokens at the top of `<style>`, then markup, then one IIFE script (`normalize()` defines the defaults for `tools.json` fields; `onKey()` holds all shortcuts and must stay in sync with `SHORTCUTS`). If you add a field to `tools.json`, add it to `normalize()`, to the `KNOWN` set in `scripts/check-tools.mjs`, and to the table above. The design source is the "simson.io/tools" Claude Design canvas.
