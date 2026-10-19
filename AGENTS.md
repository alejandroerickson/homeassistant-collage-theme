# Collage: agent orientation

This file is for any agent working with this repository: changing it, or using it to theme
someone's Home Assistant. `CLAUDE.md` is a symlink to it; keep one copy.

## What this is

A theme and a card library for Home Assistant dashboards, after the cut-paper collages of Jean Arp
and Sophie Taeuber-Arp. `themes/collage.yaml` dresses Home Assistant itself; `dist/collage.js` is
sixteen cards in one vanilla JavaScript module. Start with `README.md` (what each card does and its
options), then `DESIGN.md` (the design system) and `PRODUCT.md` (who it is for). Reference
knowledge about the repository is in `okf/` (start at `okf/index.md`).

| Path | What it is |
|---|---|
| `dist/` | What HACS installs: `collage.js`, the font and its license. |
| `themes/collage.yaml` | The theme. |
| `demo/` | Every card on a pretend Home Assistant: `node tools/serve.mjs`, open `/demo/`. |
| `tools/` | `serve.mjs` (serve the demo), `shoot.mjs` (screenshots at phone and desktop widths). |
| `examples/` | A dashboard in YAML, and packages that keep long-term statistics. |
| `docs/media/` | The README's screenshots, of the demo only. |
| `okf/` | Decisions, how to work here, releasing, the security checks. |
| `scripts/` | `bootstrap.sh` (the git hooks) and `check_publishable.py` (the privacy check). |
| `.agents/skills/` | Skills; `.claude/skills` links to it. |

## Use Impeccable for design work

Before designing, critiquing or extending a card, install [Impeccable](https://impeccable.style)
(`npx impeccable install`; in Claude Code `/plugin marketplace add pbakaus/impeccable`). `DESIGN.md`
and `PRODUCT.md` are in its format, so it reads them as the design system and the product brief.
Without it, read both files in full before touching anything visual.

## If you are installing Collage for someone

Use the skill `install-collage`. In short:

- **Their Home Assistant is a home.** Read first; change nothing they did not ask for. Show the YAML
  you will write before you write it. Never restart, reload or call a service on their instance
  without asking, and suggest a backup first.
- Find their real entities (states, areas) before writing a card; never guess entity ids.
- The cards install as a HACS Dashboard repository or by copying `dist/`; the resource must be a
  **JavaScript module**. The theme is one file copied to their `themes/` folder.
- Keep their secrets where they are: never copy a token into a file, a dashboard or a chat.

## If you are making or changing a card

Use the skill `make-a-card`. The rules that keep the look:

- **One file, no build, no dependencies.** A card is a class extending `CollageCard` in
  `dist/collage.js`, registered in `CARDS` at the end. Reuse the helpers: `MATERIAL` (paper, type,
  shadow), `scatter()` (the seeded bits), `form()` (the Arp forms), `colour()` and `inkOn()`,
  `pressable()` (tap and hold), `fetchHistory()`, `smoothPath()`, `notice()`.
- **Follow DESIGN.md**: square corners, a slight tilt, the pinned shadow, one meaning per colour,
  ink follows paper, tabular numerals, plain sentences, 44px targets, a yellow focus ring.
- **Only Home Assistant's public frontend interfaces**: the `hass` object, `callService`,
  `callWS` for history and statistics, `hass-more-info`, `ha-icon`, theme variables
  (`okf/decisions/only-public-home-assistant-interfaces.md`).
- **Every option but the entity is optional**, with defaults that work for most homes; wording
  that names a device ("Furnace") is an option, never a default.
- **Prove it in the demo.** Add the card to `demo/demo.js` with made-up entities (and their history
  to `demo/mock-hass.js`), look at it at 390px and 1300px wide (`node tools/shoot.mjs`), and
  document its options in `README.md`.
- `node --check` cannot read a module with `import.meta`; check syntax with
  `node -e "import('./dist/collage.js').catch(e => console.log(e.message))"`, which should print
  only `document is not defined`.

## This repository is public

Everything committed, every commit message and every pull request's text is published, and
history keeps it (`okf/decisions/the-repository-is-public.md`).

- **Nothing from a real home.** Examples, the demo and screenshots use made-up entities
  (`light.living_room`, "Kim", "Front door"). No real names of people, rooms or devices, no
  addresses, coordinates, network names, IP addresses, routines or health data. A screenshot shows
  the demo and nothing else, and the maintainer reviews it before it is committed.
- **No secrets.** No tokens, keys or passwords, in code, examples or docs.
- No session memory in the repository: no logs, handoff notes, records of requests or to-do lists.
  Keep those in `_private/` (ignored) or in your own memory.
- Commit messages and pull request descriptions describe the change, never the conversation.
- Never name private projects, people or files elsewhere on a machine.
- Tools that install their own instructions (memory, routing or workflow tools) keep them in your
  user-level configuration, never in this file, `.agents/skills/` or `okf/`.
- Stage files by name. `scripts/bootstrap.sh` turns on git hooks that refuse a commit or push
  carrying any of the above, including words on the maintainer's private deny list
  (`okf/operations/security-checks.md`). When one blocks, fix the content; never `--no-verify`.
- If you are unsure whether something may be published, leave it out and ask.

## Skills

| Skill | Use it |
|---|---|
| `install-collage` | Installing the theme and cards on someone's Home Assistant. |
| `make-a-card` | Making a new card or changing one. |
| `okf-orient` | At the start of a task here: what to read in `okf/`. |
| `okf-update` | Before finishing any change: which concepts it affects. |
| `okf-decision` | When a change makes, revises or reverses a durable choice. |
| `make-a-release` | When asked to release a version for HACS. |
| `audit-for-leaks` | When asked to check the repository or its history for private material. |

## Git

- Start a session with `git pull --rebase --autostash`; run `scripts/bootstrap.sh` once per clone.
- Push to `main` directly; a ruleset blocks force-pushes and deletion of `main`, so never rewrite
  published history. Fix a mistake with a new commit.
- Commit only when the maintainer asks.
- Releases are tags with a GitHub release; HACS installs from them (`make-a-release`).

## Keep the documentation true

When a change makes something in `README.md`, `DESIGN.md` or `okf/` untrue, fix it in the same
change (`okf-update`). A new durable choice gets a record in `okf/decisions/` (`okf-decision`). Run
`python3 okf/tools/validate_okf.py` before committing; CI runs it too.
