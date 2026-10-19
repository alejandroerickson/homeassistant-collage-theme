---
type: Charter
title: Collage makes a Home Assistant dashboard a cut-paper collage, and anyone can make it theirs
description: What the theme and the repository are for, who they serve, and what they are not.
tags: [charter, project]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# Charter

## What it is

A theme (`themes/collage.yaml`) and a card library (`dist/collage.js`) for Home Assistant
dashboards, after the cut-paper collages of Jean Arp and Sophie Taeuber-Arp: rooms as sheets of
poster colour on a dim wall, an Arp form on whatever is alive, history drawn as cut paper. The
design system is `DESIGN.md`; the product brief is `PRODUCT.md`.

It began as one household's dashboard. The parts that suit any home were made general and published
here; nothing from that household is.

## Who it serves

People who run Home Assistant for their own household and want a dashboard that feels like a home,
not a control room; and the coding agents they increasingly ask to install, adapt and extend it.
The repository is written so that an agent can do that well: the design system and product brief in
Impeccable's format, a demo to test against, and skills for installing and for making cards.

## What it is not

- Not a framework. One module of vanilla custom elements, no build step, no dependencies.
- Not a complete set of cards for everything Home Assistant can do. Built-in cards sit beside ours
  and the theme dresses them; we add cards where cut paper says something better.
- Not a place for anyone's real home: no real entities, names, places or screenshots
  ([decision](../decisions/the-repository-is-public.md)).

## Authority

This charter has final authority on intent. Decisions in [decisions/](../decisions/index.md)
refine it; where code disagrees with a decision, the decision wins until it is revisited.
