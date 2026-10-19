---
type: Decision
title: The cards install through HACS; the theme is one file you copy
description: HACS treats a repository as one category, so the repository is a Dashboard repository and the theme is copied by hand or by an agent.
tags: [decision, hacs, install]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# The cards install through HACS; the theme is one file you copy

## Context

HACS installs a repository as one category: a Dashboard (plugin) repository serves JavaScript, a
Theme repository serves one theme file. Collage is both. Two repositories would split one design
system in two and let the halves drift apart.

## Decision

- One repository, a HACS **Dashboard** repository: `hacs.json` names `collage.js` in `dist/`, and
  HACS installs everything in `dist/` (the module, the font, its license).
- The theme is `themes/collage.yaml`, which the user (or their agent) copies to their `themes/`
  folder. The README and the `install-collage` skill say how.
- Releases are GitHub releases; HACS offers them ([releasing](../operations/releasing.md)).

## Consequences

- One more manual step for the theme, documented in the README.
- The cards work without the theme (every colour has a fallback), but Home Assistant's own cards
  and dialogs are only paper with it.

## Constrains

- Everything HACS must install lives in `dist/`.
