# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The Home Assistant frontend: in a desktop browser, and above all in the Home Assistant phone app (a
web view), at home and away. Wall tablets work too.

## Users

Someone who runs Home Assistant for their own household and wants a dashboard that feels like their
home rather than a control room. They open the app to do one thing quickly (turn a light off, check
the doors, see the weather, move a shade) and close it. Others in the household use the same
dashboard without being taught it.

They are comfortable editing YAML or, more and more, asking a coding agent to do it. They will make
the theme their own: other rooms, other colours, devices this repository has never seen.

## Product Purpose

A theme and a card library that make a Home Assistant dashboard calm, legible and warm: a cut-paper
collage instead of a heads-up display. Success is that the first screen answers "is everything all
right?" in a sentence, the common jobs are one tap, history reads at a glance as shapes rather than
numbers, and someone who sees it on the wall smiles.

## Operating Context

- One-handed on a phone, often in the evening or in the dark; sometimes away from home.
- Automations do the routine work; the dashboard is for exceptions and for checking.
- Home Assistant updates every month: the cards use only its public frontend interfaces (the
  `hass` object, state and history, `ha-icon`, theme variables), never its internals.

## Capabilities and Constraints

- One JavaScript module of vanilla custom elements (`dist/collage.js`), no build step and no
  dependencies; three.js is loaded from a CDN only when the 3D sky is shown.
- One theme file (`themes/collage.yaml`) that also dresses Home Assistant's own cards and dialogs.
- Installed through HACS (as a Dashboard repository) or by hand; the theme is copied.
- Cards read history from the recorder (ten days by default) and, where a package provides them,
  long-term statistics.
- Nothing is sent outside the home except by the 3D sky (map tiles, building footprints, three.js),
  and only when it is turned on.

## Evidence on Hand

The demo (`demo/`) runs every card on made-up entities and ten days of made-up history. There are
no real homes, photos or brand assets in this repository, and none should be added.

## Product Principles

1. The first screen answers "is the house all right?" before anything else.
2. One tap for the common jobs; everything else is one level down (hold, or turn the card over).
3. Show what is unusual (a light on, a door open, a device not answering, a low battery); quiet when
   all is normal.
4. Plain names for rooms and things, as the household says them, in plain sentences.
5. Nothing that needs maintenance after a Home Assistant update.
6. Every card works with nothing but its entity: everything else is an option.
