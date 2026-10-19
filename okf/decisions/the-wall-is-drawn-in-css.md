---
type: Decision
title: The wall is drawn in CSS, not a picture
description: The theme's dim wall is a few radial gradients in lovelace-background, so the theme needs no image and carries no picture's license.
tags: [decision, theme, design]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# The wall is drawn in CSS, not a picture

## Context

The collage is pinned to a dim violet-grey wall. A photograph would need hosting, a known license
and a path that differs between HACS and a manual install.

## Decision

- `lovelace-background` in `themes/collage.yaml` is five soft radial lights over `#0F1016`, fixed,
  so the wall stays put while the cards scroll.
- A user who wants a picture replaces that one line; the theme says how.

## Consequences

- The theme is one self-contained file.

## Constrains

- No images in `themes/` or `dist/` but the font.
