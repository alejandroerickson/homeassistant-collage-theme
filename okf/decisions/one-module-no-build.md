---
type: Decision
title: One module of vanilla custom elements, no build step
description: Every card is in dist/collage.js, plain JavaScript with no dependencies, so it can be read, copied and changed by anyone and any agent.
tags: [decision, architecture, cards]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# One module of vanilla custom elements, no build step

## Context

A dashboard theme is something people change. A framework, a bundler or a package manager stands
between them and a colour; Home Assistant also changes every month, and a dependency is one more
thing to break.

## Decision

- Every card is a class extending `CollageCard` in `dist/collage.js`, registered in `CARDS` at the
  end of the file, with shared helpers above it. The file is what HACS installs, as it is.
- No runtime dependencies. The one exception is three.js, imported from jsDelivr only when the 3D
  sky is shown.
- The module finds its font next to itself (`import.meta.url`), so it must be loaded as a
  JavaScript module.
- Rejected: Lit or another component library (a dependency and a build step for little gain);
  splitting into several modules (HACS serves a folder, but one file is easier to copy by hand).

## Consequences

- The file is long; sections are marked with `// ---------- name ----------` comments.
- Anyone can fork and edit it in place, and an agent can read the whole library in one pass.

## Constrains

- No `package.json` dependencies for the cards; `tools/` scripts use only Node's standard library.
