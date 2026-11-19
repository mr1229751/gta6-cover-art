# Leonida Posters — Cover Art Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/mr1229751/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/mr1229751/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Leonida Posters turns your own photos and a caption into GTA-style cover
art: angled multi-panel poster layouts, a sunset / neon / noir colour
grade, and bold condensed caption lettering, exported as a PNG in the
common post sizes — 1080 × 1080, 1080 × 1350 and 1920 × 1080.

Everything runs locally in the browser. Photos are read from your machine
and never uploaded; the app is plain static files with no build step and
works with the network off.

## What it does

- **Your photos, your panels.** Add photos, then click a panel and click a
  photo to drop it in. One photo can fill the whole poster, or every panel
  can hold a different one. Drag on the cover to frame a panel's photo and
  use the zoom slider to crop tighter.
- **Three poster layouts** — Poster (tall hero, stacked pair, wide strip),
  Quad (four angled frames) and Strips (three slanted columns).
- **Three colour grades** — Sunset (amber into magenta), Neon (cyan into
  pink) and Noir (silvered monochrome with crushed blacks).
- **Lettering.** The caption is set in Anton (SIL Open Font License, a
  local file under `app/fonts/`), outlined and gradient-filled over a
  dusk band, with a letterspaced subtitle beneath.
- **Export.** One click renders the cover at full post size and downloads
  the PNG. The preview and the export are painted by the same canvas
  engine (`app/src/render.js`), so what you see is what you share.
- **Present mode** shows the cover alone, full-screen.

Four bundled sample photos (two supplied with the competition kit, two
drawn for this app) let you try it without uploading anything.

## Run

Hand the entry in (copies `app/` and `screenshots/` to the output
directory and writes the dossier):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Serve the app locally with any static file server, for example:

```sh
cd app && python3 -m http.server 8080
```

then open http://localhost:8080 in desktop Chrome.

## Layout of the code

- `main.ts` — the handover program (Node 22, standard library only).
- `app/index.html`, `app/styles.css` — the page and the editor chrome.
- `app/src/render.js` — the cover drawing engine (panels, grades, lettering).
- `app/src/layouts.js` — the three panel layouts as normalised polygons.
- `app/src/state.js` — editor state: photos, per-layout panel assignments.
- `app/src/editor.js` — control wiring, tray, drag-to-frame.
- `app/src/export.js` — full-size PNG export through the same engine.
- `app/src/main.js` — boot: waits for the display font, starts the editor.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.
