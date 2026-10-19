---
type: Process
title: How to change this repository
description: The rules every change follows, for people and agents, including what may never be committed.
tags: [process, agents, contributing, public]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# Working in this repository

## The repository is public

Everything committed, including history, commit messages and pull requests' text, is published
([decision](../decisions/the-repository-is-public.md)).

- Nothing from a real home: the demo, examples and screenshots use made-up entities. A screenshot
  shows the demo, is kept under `docs/media/`, and is reviewed by the maintainer before it is
  committed.
- No secrets, tokens, absolute local paths, private network addresses, coordinates or personal
  details. No names of private projects, clients or employers.
- No session notes, logs, requests or to-do lists. They go in `_private/` (ignored). Planned work
  goes in the [roadmap](../project/roadmap.md).
- Commit messages and pull request descriptions describe the change, never the conversation.
- `scripts/bootstrap.sh` turns on git hooks that refuse a commit or push carrying any of this, and
  CI checks again ([security checks](../operations/security-checks.md)). When a hook blocks, fix
  the content; never `--no-verify`.

## Changing a card or the theme

1. **Design first.** Read `DESIGN.md` and `PRODUCT.md`; use [Impeccable](https://impeccable.style)
   if you have it. A new pattern that other cards should follow goes into `DESIGN.md` in the same
   change.
2. **One module, no build** ([decision](../decisions/one-module-no-build.md)), **public interfaces
   only** ([decision](../decisions/only-public-home-assistant-interfaces.md)).
3. **Every option but the entity is optional**; a word that names a device or a household is an
   option, never a default.
4. **Prove it in the demo** at 390 and 1300 pixels wide
   ([decision](../decisions/the-demo-is-the-test-bench.md),
   [local development](../operations/local-development.md)).
5. **Document it**: the card's options in `README.md`, its look in `DESIGN.md`.

## Before you finish

- `node -e "import('./dist/collage.js').catch(e => console.log(e.message))"` prints only
  `document is not defined`.
- The demo shows the change working, with nothing in the browser console from the cards.
- A change a user would notice bumps `VERSION` in `dist/collage.js` at release time
  ([releasing](../operations/releasing.md)).
- Update the bundle, and run `python3 okf/tools/validate_okf.py`.
