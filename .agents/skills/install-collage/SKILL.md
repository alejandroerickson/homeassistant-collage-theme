---
name: install-collage
description: Install the Collage theme and cards on someone's Home Assistant and lay out a first dashboard from their real entities. Use when asked to install, apply, set up or try the Collage theme or its cards, to make a dashboard in the Collage style, or to move an existing dashboard to it.
---

# Install Collage on a Home Assistant

The person's Home Assistant runs their home. Everything here reads first and changes only what they
asked for, after showing them the change.

## What must stay true

- **Ask before you change the running Home Assistant.** Restarting, reloading themes, adding a
  resource, saving a dashboard or calling a service all affect the house and the people in it.
  Say what you will do, and wait for their yes.
- **Suggest a backup first** (Settings > System > Backups), and keep a copy of any dashboard you
  replace.
- **Never guess entity ids.** Read them (the states API, the entity list, or the person's
  configuration) and use the ones that exist.
- **Keep secrets where they are.** A long-lived token stays in an environment variable or the
  person's secrets store, never in a file you write, a dashboard or the conversation.

## Procedure

1. **Find out how they run Home Assistant**: HA OS or Supervised (add-ons, `/config` over Samba or
   SSH), Container or Core (a `config` folder on disk). Ask if you cannot see it. Find whether HACS
   is installed.
2. **The cards.** With HACS: Custom repositories > add
   `https://github.com/alejandroerickson/home-assistant-collage-theme` as **Dashboard**, download
   **Collage**. Without HACS: copy everything in `dist/` to `/config/www/collage/` and add the
   resource `/local/collage/collage.js`. Either way the resource must be a **JavaScript module**
   (Settings > Dashboards > Resources); check that it is there.
3. **The theme.** Make sure `configuration.yaml` has
   `frontend: themes: !include_dir_merge_named themes`; copy `themes/collage.yaml` to
   `/config/themes/`; with their yes, call `frontend.reload_themes` (a restart only if the
   `frontend:` line was new).
4. **Read their home**: areas, lights and switches per room, climate, weather, people, locks, door
   contacts, media players, batteries. Note what they have that no card covers; built-in cards
   cover it, dressed by the theme.
5. **Draft a dashboard** from `examples/dashboard.yaml` and the README's card reference: a sections
   view, `theme: Collage` on every view, the status card first, a room card per room with lights
   (one paper colour per room, from the six, never repeated in a row), then climate, sun, weather,
   and whatever else they have. Show them the YAML.
6. **With their yes**, create it as a new dashboard (never overwrite their default one unasked).
7. **Check it** on a phone's width: nothing scrolls sideways, every card finds its entities, the
   font is Familjen Grotesk (if it is Roboto, the resource is not a module).

## When something is missing

- "Custom element doesn't exist": the resource is missing, or not a module, or the browser has the
  old list; reload without the cache.
- A history card says "No record": the recorder keeps ten days by default; the packages in
  `examples/packages/` keep long-term statistics for the doors and the stove.
- The 3D sky asks Esri, OpenStreetMap and jsDelivr for the area around the home location. Tell the
  person before turning on `map`, and leave it off if they would rather not.
