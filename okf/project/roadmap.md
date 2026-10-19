---
type: Roadmap
title: What is built, what is next, and the open questions
description: The state of the theme and the cards, and what may come.
tags: [roadmap, project]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# Roadmap

## Built (0.0.0)

- The theme, covering Home Assistant's cards, dialogs, header, sidebar, states, charts and the
  energy dashboard.
- Sixteen cards: room, status, action, heat, sun (with the 3D sky and a shade), upkeep, sensor,
  weather, media, lock, people, the doors and doors, toothbrush, the range and at the stove.
- The demo on a pretend Home Assistant, and screenshots from it.
- Packages that keep long-term statistics for the door and stove cards.

## Next, in no order

- Publish the demo on GitHub Pages, so it can be seen without cloning.
- Cards for what many homes have and the library lacks: a fan, a vacuum, an energy day, a camera
  snapshot as a cut photo, a garage door.
- Visual editors (`getConfigElement`) so cards can be set up without YAML.
- Translations of the cards' sentences.
- The Heat card for thermostats with two setpoints (`heat_cool` with `target_temp_low` and
  `target_temp_high`): today it shows their modes and history but cannot change the setpoints.

## Open questions

- Whether the theme should offer a light wall as well as the dim one.
- Whether the toothbrush and range cards, which suit one brand each, belong in the main file or in
  a second, optional module.
