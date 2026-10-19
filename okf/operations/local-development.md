---
type: Process
title: Developing against the demo
description: How to run the demo, take screenshots, check the module and set up a checkout.
tags: [operations, development, demo]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# Local development

Nothing to install but Node (18 or later) and Chrome.

```sh
scripts/bootstrap.sh              # once per clone: the git hooks
node tools/serve.mjs              # then open http://localhost:8770/demo/
node tools/shoot.mjs --sky 15:30  # docs/media/: each view at 1300 and 390 pixels wide
```

- `/demo/?view=home|doors|kitchen` picks a view; `?card=collage-lock-card` shows one card alone;
  `?sky=15:30` turns the 3D sky to that time; `?width=390` draws the page at a phone's width.
- The demo's home point is a well-known place in the viewer's time zone (`PLACES` in
  `demo/mock-hass.js`), so the sky agrees with the clock.
- `tools/shoot.mjs` finds Chrome at its usual macOS and Linux paths, or uses `CHROME`; on macOS it
  saves JPEGs with `sips`.
- To try a change on a real Home Assistant, copy `dist/` over the installed copy
  (`/config/www/community/homeassistant-collage-theme/` under HACS) and reload the browser
  without its cache. Bump the resource's `?v=` query so phones fetch it again.

## Checks

```sh
node -e "import('./dist/collage.js').catch(e => console.log(e.message))"   # only: document is not defined
python3 okf/tools/validate_okf.py
python3 scripts/check_publishable.py --all
```

CI runs the same, and HACS's own validation.
