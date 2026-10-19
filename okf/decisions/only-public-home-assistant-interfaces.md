---
type: Decision
title: Only Home Assistant's public frontend interfaces
description: Cards read the hass object, history and statistics, and call services; never the frontend's internals, so an update does not break them.
tags: [decision, home-assistant, cards]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# Only Home Assistant's public frontend interfaces

## Context

Custom cards that reach into Home Assistant's frontend internals break on updates. Ours should not
need maintenance after one (`PRODUCT.md`, principle 5).

## Decision

- Cards use the `hass` object (`states`, `config`, `callService`, `callWS`, `connection`), the
  websocket calls `history/history_during_period`, `recorder/statistics_during_period`,
  `weather/subscribe_forecast` and `backup/info`, the `hass-more-info` and `location-changed`
  events, `ha-icon`, and theme variables.
- The one reach into the page's structure is `keepOnScreen()`, which clips Home Assistant's view at
  its sides so scattered bits never make a phone scroll sideways; it fails quietly.
- Styling of built-in cards is done only through theme variables, never card-mod.

## Consequences

- Some built-in details stay as Home Assistant draws them (tile icon backgrounds).

## Constrains

- A new websocket call is listed here, and answered in `demo/mock-hass.js`.
