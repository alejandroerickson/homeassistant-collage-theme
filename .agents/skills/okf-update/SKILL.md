---
name: okf-update
description: Keep the Collage repository's documentation true (README, DESIGN, PRODUCT and okf/), and write or revise any concept in okf/. Use before finishing any change to the cards, the theme, the demo, tooling, CI or process; when asked to document something; and whenever the documentation no longer matches the code.
---

# Keep the documentation true

**A change that makes a document untrue fixes that document in the same change.** Correct what is
there in preference to adding a near-duplicate.

## Procedure

1. List what changed: `git status --short`, `git diff --name-only`.
2. Find the affected documents with the impact map below, and grep for names you renamed or removed.
3. Correct each in place, in the present tense. Do not describe how it came to be.
4. A durable choice gets a decision record (`okf-decision`).
5. Update `okf/project/roadmap.md` if the change builds something listed there.
6. On every `okf/` concept you edit, set `generated` to `{by: agent:<your-name>, at: <YYYY-MM-DD>}`;
   keep `status` accurate (`draft` until reviewed).
7. A new `okf/` file gets a line in its directory's `index.md`. A new concept type gets a row in
   `okf/ontology.md` and in `TYPES` in `okf/tools/validate_okf.py`.
8. `python3 okf/tools/validate_okf.py` reports 0 errors.
9. Reread what you wrote for session talk, private names and anything from a real home. The hooks
   catch patterns, not judgement.

## Impact map

| When you change | Check |
|---|---|
| A card's options or behaviour | `README.md` (its section), `examples/dashboard.yaml`, the demo |
| A card's look, a colour's meaning, a new pattern | `DESIGN.md` |
| A new card | `README.md`, `DESIGN.md`, `CARDS`, the demo, the roadmap, the card count in `README.md` and `okf/project/roadmap.md` |
| `themes/collage.yaml` | `DESIGN.md` (Colors), `README.md` (The theme) |
| A websocket call or Home Assistant interface | decision `only-public-home-assistant-interfaces`, `demo/mock-hass.js` |
| `hacs.json`, `dist/` layout, `VERSION` | `okf/operations/releasing.md`, decision `cards-through-hacs-theme-copied` |
| `tools/`, `demo/` | `okf/operations/local-development.md`, decision `the-demo-is-the-test-bench` |
| `scripts/check_publishable.py`, `.githooks/`, workflows, `SECURITY.md` | `okf/operations/security-checks.md` |
| A new top-level entry | `AGENTS.md` (the table), `TOP_LEVEL` in `scripts/check_publishable.py` |
| How work is done | `okf/process/working-in-this-repository.md`, `AGENTS.md` |

## Never put in the repository

Session history, task logs, handoff notes, requests, to-do lists, private names, local paths,
secrets, anything from a real home, or a proposal written as though it were decided.
`okf/log.md` is gitignored on purpose.
