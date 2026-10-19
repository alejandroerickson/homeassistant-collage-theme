---
type: Decision
title: The demo is the test bench
description: Every card is checked on a pretend Home Assistant with made-up history before it ships, at a phone's width and a desktop's.
tags: [decision, testing, demo]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# The demo is the test bench

## Context

Cards are visual and depend on states and history. Testing against a real home would put that home
in screenshots; having no check at all lets a card break on a phone unnoticed.

## Decision

- `demo/mock-hass.js` is a pretend Home Assistant: made-up entities, ten days of seeded history,
  service calls that change its states, and answers to the websocket calls the cards make.
- `demo/demo.js` lays every card out in three views; `tools/serve.mjs` serves it and
  `tools/shoot.mjs` screenshots it at 1300 and 390 pixels wide in headless Chrome.
- The README's screenshots come from the demo, never from a real home.

## Consequences

- A new card, or a new websocket call, also changes the demo.
- The demo needs network access for icons (`@mdi/js`), three.js and the map tiles.

## Constrains

- `tools/` uses only Node's standard library and an installed Chrome.
