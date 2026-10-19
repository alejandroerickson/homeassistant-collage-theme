---
name: make-a-card
description: Make a new Collage card or change an existing one, in the design system, tested in the demo. Use when asked to add a card, support a new kind of device, change how a card looks or behaves, or extend the Collage theme to something it does not cover yet.
---

# Make a Collage card

Read `DESIGN.md` and `PRODUCT.md` first, in full. If [Impeccable](https://impeccable.style) is
installed, use it (`/impeccable shape` before, `/impeccable critique` and `polish` after); it reads
both files.

## Decide what the card is

1. **What does it answer, in one sentence?** "Is the garage shut?", "How much power right now?".
   That sentence is its state line.
2. **What is the one tap?** Toggle, open, play. Hold opens Home Assistant's details.
3. **What is it as cut paper?** A sheet in a room's colour, a form for a series, tabs that hang
   from a line, a figure cut from paper. Use a meaning the palette already has (`DESIGN.md`,
   Colors): heat vermilion, light orange, cold and security cobalt, things to look at pink.
4. **What is alive?** Only that gets an Arp form.

## Build it

- A class extending `CollageCard` in `dist/collage.js`, in its own `// ---------- name ----------`
  section before the registry, and a line in `CARDS`.
- `validate(c)` throws on a missing entity and returns defaults for everything else;
  `watch()` lists the entities it reads; `update(reloadHistory)` draws; `getGridOptions()` asks for
  12 columns, or 6 (minimum 3) for a small card.
- Start the style from `MATERIAL`; take the helpers: `scatter(seed)`, `form(n, colour)`,
  `colour()`, `inkOn()`, `pressable()`, `this.run()` (says when a device doesn't answer),
  `fetchHistory()`, `this.scheduleHistory()`, `smoothPath()`, `rng(seed)` for anything that
  should look hand-cut but stay put.
- Square corners, a tilt from `seededTilt()`, the pinned shadow, tabular numerals, plain
  sentences, 44px targets, `aria-label`s that say what a tap does, and nothing that moves under
  `prefers-reduced-motion`.
- Keep the focused element across redraws (`data-focus`), and never redraw under a finger
  (`this._busy`, `this.release()`).

## Prove it

1. Add made-up entities (and history) to `demo/mock-hass.js` and the card to a view in
   `demo/demo.js`. Answer any new websocket call in the mock.
2. `node tools/serve.mjs`, open `/demo/`, try every state: on, off, unavailable, no history.
3. `node tools/shoot.mjs --views <view>`: look at both widths. Nothing may scroll sideways.
4. `node -e "import('./dist/collage.js').catch(e => console.log(e.message))"` prints only
   `document is not defined`.

## Document it

- The card's section in `README.md`: what it shows, its YAML with every option.
- Its component in `DESIGN.md`, and any new rule.
- `okf/project/roadmap.md` if it was listed there; `okf-update` for the rest.
