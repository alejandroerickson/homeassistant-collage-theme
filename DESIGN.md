---
name: Collage
description: The house as cut paper pinned to a dim wall, one colour per room, an Arp form on whatever is alive.
colors:
  cobalt: "#1F3D8C"
  cadmium-yellow: "#F2B705"
  orange: "#E8632B"
  vermilion: "#D7301F"
  olive: "#6B7F2A"
  pink-paper: "#E9A3B8"
  ink-black: "#141414"
  paper: "#F4F0E6"
  pencil: "#4A4740"
  faded: "#8C877C"
  track: "#D9D2C1"
  wall: "#0F1016"
  wall-raised: "#1E2029"
typography:
  display:
    fontFamily: "Familjen Grotesk, Roboto, sans-serif"
    fontSize: "92px"
    fontWeight: 700
    lineHeight: 0.82
    letterSpacing: "-0.05em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Familjen Grotesk, Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Familjen Grotesk, Roboto, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  figure:
    fontFamily: "Familjen Grotesk, Roboto, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  body:
    fontFamily: "Familjen Grotesk, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "Familjen Grotesk, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.04em"
    fontFeature: "tnum"
rounded:
  none: "0px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "14px"
  xl: "20px"
  tap: "44px"
components:
  room-card-off:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    height: "200px"
  room-card-on:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "200px"
  action-bar:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "64px"
  paper-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "14px"
  colour-card:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "14px"
  step-button:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    size: "44px"
  chip:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  chip-warn:
    backgroundColor: "{colors.pink-paper}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "8px 10px"
  alert-tag:
    backgroundColor: "{colors.pink-paper}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.none}"
    padding: "7px 11px 6px"
  alert-tag-error:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "7px 11px 6px"
  temperature-patch:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.none}"
    padding: "8px 18px 4px 14px"
---

# Design System: Collage

## Overview

**Creative North Star: "The House as a Taeuber-Arp Collage"**

The dashboard is a cut-paper collage pinned to a dim violet-grey wall. Rooms are flat rectangles of coloured paper, each pinned at a slight tilt in a working grid; whatever is alive right now carries an organic Arp form floating over its corner; loose bits of patterned paper, triangles, discs and black bars peek out from under the cards. Organised chaos: the grid is the order and holds every reading, the scattered paper is the chaos and holds none.

The world is Collage Layers, after Jean Arp and Sophie Taeuber-Arp. The palette is a modernist poster's: cobalt, cadmium yellow, orange, vermilion, olive and pink, with ink black and an off-white paper. Every surface is opaque paper with square cut edges and a hairline pinned shadow. Type is one quirky grotesk, set tight and bold, with tabular numerals for every reading. History is drawn as cut paper too: a row of rectangles per hour, a day's temperature as one hand-cut form, the sky as a paper dome.

It is deliberately not the usual Home Assistant look. No rounded tiles, no glass, no neon on black, no gauges; nothing says "heads-up display". A dashboard in Collage is something a person would pin to a wall.

The theme is applied per view, on every view of a dashboard, and is safe as the default theme (light and dark), so the dialogs a card opens and Settings are paper too. Outside a dashboard view the page is a darker sheet of paper (`#E6E0D2`); only dashboard views get the wall. Dialogs and bottom sheets are square.

**Key Characteristics:**
- Opaque cut paper on a dim wall; no glass, no translucent surfaces, no rounded tiles.
- One paper colour per room; an Arp form marks what is on.
- Every card is tilted between about -2 and +2 degrees and casts a hairline pinned shadow.
- Patterned-paper bits scatter around every card, seeded so they stay put.
- Familjen Grotesk throughout, bold and tight, tabular numerals for readings.
- Data drawn as cut shapes: hourly rectangles, one organic form per series, the sun as a paper disc.

## Colors

Saturated poster colours from a modernist collage, used as flat opaque paper, on a near-black wall. Each keeps one meaning across every card.

### Primary
- **Cobalt** (`cobalt`, `--hc-cobalt`): the house's own colour and Home Assistant's primary colour. Night and cold: the moon, the outside temperature, the cold line, the weather card's patch. Security: a lock that is locked, an alarm that is armed, the house the people card stands its figures in. Switches when on.
- **Vermilion** (`vermilion`, `--hc-red`): heat and alarm. The inside-temperature patch, the thermostat's form, a burner that is on, low batteries, error alerts, a jammed lock, a triggered alarm.

### Secondary
- **Cadmium Yellow** (`cadmium-yellow`, `--hc-yellow`): the sun and the focus ring. The sun disc by day, the sun's lit wedge, the "done" confirmation, the selected tab and sidebar item, a lock that is unlocked, a burner's heart.
- **Orange** (`orange`, `--hc-orange`): light. Lights when on (the theme's state colour), a shade's fabric, an oven that is on, media playing.

### Tertiary
- **Olive** (`olive`, `--hc-olive`): the yard and good health. A full battery, success, someone home (the theme's person colour).
- **Pink Paper** (`pink-paper`, `--hc-pink`): things to look at. Warning chips, alert tags, "Tap again to unlock", findings slips (alternating with cadmium yellow), and the tip of anything past its limit.

### Neutral
- **Ink Black** (`ink-black`, `--hc-black`): all type on paper, the action bar, step buttons, chips, the header and sidebar, black scattered bars, the record.
- **Paper** (`paper`, `--hc-paper`): the off-white sheet every white card is cut from, and the type on dark papers. Built-in cards, dialogs and surfaces wear it through the theme.
- **Pencil** (`pencil`): secondary text, axis labels, idle icons.
- **Faded** (`faded`): disabled text and devices not answering.
- **Track** (`track`): the empty part of a strip or bar on paper (empty hour cells, battery tracks).
- **Wall** (`wall`) and **Wall Raised** (`wall-raised`): the wall behind the cards, drawn by the theme in CSS (`lovelace-background`: a few soft radial lights on a near-black), and Home Assistant's secondary background.

### Named Rules
**The One Paper Per Room Rule.** Each room is assigned one paper colour from the six. Off, the room is paper with a strip of its colour and a faint dot grain of it; on, the whole sheet turns its colour.

**The Ink Follows Paper Rule.** Type on yellow, pink or paper is ink black; type on cobalt, vermilion, orange, olive or black is paper. No other text colours on coloured paper. In code: `inkOn(colour)`.

**The One Meaning Per Reading Rule.** A kind of reading keeps its colour on every card: the inside temperature vermilion, the outside temperature cobalt, light orange, a burner vermilion, an oven orange. A door keeps one paper on every card it appears on.

**The Wall Is a Wall Rule.** The ground is always the wall. Never a plain flat colour, never a bright gradient, never a photograph of anything in particular.

## Typography

**Display Font:** Familjen Grotesk (with Roboto, sans-serif), served next to the cards (`dist/familjen-grotesk.woff2`) and declared on the page by `dist/collage.js`, weights 400 to 700.
**Body Font:** the same.

**Character:** A quirky, slightly condensed grotesk set bold and tight, like letters cut from a poster. One family does every job; hierarchy comes from size and weight.

### Hierarchy
- **Display** (700, 92px, 0.82): the inside temperature on its vermilion patch. One per screen. Poster figures sit off the ramp: a weather card's 72px, a sensor's 56px, a span's total at 42px.
- **Headline** (700, 30px, 1, max 15ch): the status sentence ("All quiet. Every light is off.", "2 things to look at.").
- **Title** (700, 25px, 0.95 to 1): room names and card titles.
- **Figure** (700, 17 to 26px, -0.02em, tabular): readings inside a card: hours today, brightness, setpoint, times, chip values.
- **Body** (500 to 600, 12 to 16px): state lines ("on since 08:22", "Off, 1 h ago"), row names, legends.
- **Label** (600, 11 to 12px, 0.04em, uppercase only for the unit words INSIDE and SET): hour ticks, axis labels, units under a figure. No other word is set in capitals.

### Named Rules
**The Tabular Reading Rule.** Every number that can change (temperatures, durations, times, percentages) is set with tabular numerals, so a reading never jitters as it updates.

**The Plain Sentence Rule.** Status is said in a plain sentence in the household's words, not as a label and a value. "The back door is open, 4 m." not "Back door: OPEN".

## Layout

Cards are made for Home Assistant's sections view (12-column grid). Room, lock and sensor cards ask for 6 columns (minimum 3) so they sit two to a row; everything else is full width. On a phone the sections stack, so the first screen is the status sentence, the temperature and the rooms.

Cards keep the grid; the collage happens at their edges. Each card is rotated a little (room cards by a seeded -2 to +2 degrees, others by fixed values between -0.6 and +0.6 degrees, the temperature patch by -2 degrees). Scattered bits sit in a layer under the card and stick out 6 to 26px past its edges, at -38 to +38 degrees. The view is cut at its sides (each card sets `overflow-x: clip` on Home Assistant's view), so on a phone the bits run off the screen's edge and the page never scrolls sideways. A chart never holds its card open: SVGs are `max-width: 100%` and are redrawn at the width they get.

Spacing is small and tight: 14px inside cards, 12px between blocks inside a card, 6 to 8px between buttons and chips, 20px inside the action bar. Every button and toggle is at least 44px.

## Elevation & Depth

Depth is real overlap of opaque paper. There is one pinned-paper shadow, a hairline contact line plus a short soft drop, and it is the same on built-in cards (through `ha-card-box-shadow`) and on ours. Nothing is lifted on hover; things are laid down, not floated.

### Shadow Vocabulary
- **Pinned sheet** (`box-shadow: 0 1px 1px rgba(0,0,0,.28), 0 8px 18px -6px rgba(0,0,0,.45)`): every card.
- **Scrap** (`box-shadow: 0 1px 1px rgba(0,0,0,.25), 0 4px 8px -4px rgba(0,0,0,.5)`): scattered bits, swatches, slips.
- **Patch** (`box-shadow: 0 1px 1px rgba(0,0,0,.3), 0 10px 20px -8px rgba(0,0,0,.6)`): the temperature patch and alert tags, which sit on the wall.
- **Form** (`filter: drop-shadow(0 6px 8px rgba(0,0,0,.4))`): Arp forms and chart forms.

### Named Rules
**The Real Overlap Rule.** Layers are separate opaque pieces that overlap and cast the pinned shadow. No transparency, blur or glass to suggest depth. (The 3D sky's dome is the one glass in the house: it is the sky.)

## Shapes

Tiles, cards, bars, buttons and chips are rectangles with square corners (0px), set at a slight tilt. Curves belong to the collage pieces: the five Arp forms (drawn in a 100 x 100 box and named by number, 1 to 5), discs, half-discs, the sun and moon, the record, a lock's escutcheon, and hand-cut chart forms, whose bottom edge wobbles rather than following a ruled line. Scattered bits come in a fixed set: patterned paper (halftone dots, stripes, squared paper), triangles, black bars 5 to 8px wide, discs, half-discs and plain strips.

### Named Rules
**The Square Cut Rule.** Anything that holds information or takes a tap has square corners. Round shapes are collage pieces, never containers.

## Components

Each card is a custom element in `dist/collage.js`, extending `CollageCard` (state, history, notices, tap and hold). The README has every card's options.

### Room card
A room as a sheet of paper; the whole sheet is the toggle.
- **Shape:** aspect 1 : 1.16 (1 : 1.42 with a brightness bar), at least 200px tall, tilted by a seeded -2 to +2 degrees.
- **Off:** paper with the room's colour as a tilted swatch across the top (holding the name) and a faint dot grain of it (opacity 0.2). The state line reads "Off, 1 h ago".
- **On:** the whole sheet in the room's colour; the room's Arp form floats over the top-right corner, landing with a short "lay" animation when it turns on.
- **Foot:** "Today" with the hours on, "This week" with the total, and a 24-cell strip of the last 24 hours, one rectangle per hour, its height the fraction of the hour on; the current hour is outlined.
- **Flip:** a 36px black button turns the card over to Hour, Day and Week tabs, four figures and level buttons.
- **Interaction:** tap toggles; hold (520ms) opens Home Assistant's details; Enter or Space toggles. Controls inside the card carry the class `nopress` and never toggle it. Unavailable rooms go greyscale and do not toggle.

### Status card
The house in one sentence, straight on the wall with no sheet behind it: the inside temperature on a vermilion patch in Display type, a sun disc (yellow by day, cobalt at night) with the next sunset or sunrise, the status sentence in Headline type, which lights are on, and alert tags (pink, vermilion for errors).

### Action bar
One black bar, one action: full width, at least 64px, tilted 0.6 degrees, with an Arp form crossing its top edge; after a tap, " — done" in yellow for 2.2 seconds.

### Charts on paper (Heat, Sensor, Weather, Doors)
- A series is one filled form in its colour, averaged over short spans so it reads as a shape, rising from a hand-cut bottom edge.
- A target or the usual is a dashed ink line; a cold threshold is a dashed cobalt line.
- Events hang under a black line as tabs (door openings, rain) or sit as black bars under the form (heating runs).
- **Your usual:** the median of comparable earlier periods, dashed, said in the key ("Usual, 50 m a day").
- **No reading:** a dotted line where the value would be; never zero (**The Gap Is a Gap Rule**).
- **So far:** a period still running is a hollow outline in its colour.
- **Past its limit:** a pink tip on the end of a tab or bar, and a pink tag on its slip.
- **Readout bar:** a black bar (tilted 0.5 degrees, at least 52px) reads out the selected day, week or bucket; pointing, a finger or the arrow keys select.
- **Findings:** plain sentences on paper slips, pink and cadmium yellow in turn, each tilted a little. Only what the record can back.

### Sun card
A cobalt sheet. The sun's arc as a paper fan (a cobalt semicircle, a yellow wedge for the day so far, a vermilion sun on a black horizon bar), or, with the map, the sky in 3D: a disc of aerial imagery with paper buildings stood on it (the home's in yellow), a glass dome with 30° and 60° rings, today's sun path in yellow with black hour beads, the moon's in pale paper with its phase drawn on paper, and real shadows. A shade sits on a paper inset: the window, the orange fabric between its rails, each rail draggable with a dashed yellow ghost for its target.

### Upkeep card
Batteries as cut-paper batteries (a 4px ink outline with a nub, four hand-cut cells, olive, orange or vermilion by charge, empty cells halftone-dotted), two to a row, lowest first, with no percentage on screen. Chips: square black chips with a Figure value over a body label; pink when something needs a look.

### Weather card
The sky cut from paper in a 100 x 80 box (`skyArt`): a yellow sun, a cobalt moon, clouds of darker paper (`#CFC7B4`, pencil for rain clouds), cobalt rain, ink hail, a yellow bolt, grey strips of fog, black strips of wind. The temperature on a cobalt patch. The next hours as one cobalt form on a black line with rain hanging under it; the coming days as tilted slips.

### Media card
A record sleeve: cover art pasted on as a cut photo, tilted -3 degrees, or the card's colour with a dot grain; the record (black, grooved, a label in the card's colour) peeks out and turns while it plays. Square black transport buttons; play is the card's colour. A volume bar like the room card's brightness bar.

### Lock card
A sheet in the lock's state colour (cobalt locked, yellow unlocked, vermilion jammed, paper while moving) with a paper escutcheon and an ink keyhole, and a black bolt that slides into a paper strike. Unlocking asks for a second tap on a pink tag.

### People card
Paper figures (a disc head, half-disc shoulders) in each person's colour standing inside a cobalt house with a pitched roof; whoever is out stands outside it, dashed, over a black ground line, with their zone.

### Doors cards
Each door an ink doorway with a paper leaf carrying a band of its colour and a faint dot grain; open, the leaf turns the door's colour, swings out on its hinge and an Arp form lands on it. Tags at least 44px tall, a small word over a Figure value: the alarm (black disarmed, cobalt armed, vermilion triggered, pink not answering) and any sensor.

### Toothbrush, the range, at the stove
A brush's runs cut out and pinned to a strip of the day. A range from above: an ink cooktop with paper rings, a burner on as a vermilion disc with a yellow heart as wide as its power; the ovens as paper doors that turn orange.

### Notices
When a device does not answer, a pink tag with ink type lands across the foot of its card for seven seconds and says so in a plain sentence.

### Buttons and focus
- **Shape:** square black buttons with paper icons (Material Design Icons through `ha-icon`), 44px.
- **Focus:** a 3px cadmium-yellow outline, offset 2 to 3px, on every pressable element.

### Built-in cards under Collage
Home Assistant's own cards sit beside ours. The theme makes them paper: square corners, no border, the pinned-sheet shadow, ink type, paper headings on the wall, a black header and sidebar with a yellow selection, and the six papers for states, charts and the energy dashboard. Tile icon squares keep Home Assistant's translucent tinted backgrounds, which no theme variable reaches.

## Do's and Don'ts

### Do:
- **Do** give every room one paper colour from the six and keep it there across the room card, its strip and its form.
- **Do** mark what is alive with an Arp form, and only what is alive.
- **Do** tilt every card a little (about -2 to +2 degrees) and give it the pinned-sheet shadow.
- **Do** scatter collage bits around new cards with the shared seeded `scatter()`, so they stay put between renders.
- **Do** draw history as cut paper: rectangles per hour, filled forms, bars; set every reading with tabular numerals.
- **Do** keep every common job one tap, with hold for details and a 44px minimum target.
- **Do** read colours from the theme's `hc-*` variables, with the hex as fallback (`colour()` does it).
- **Do** say a state in a plain sentence, in the household's words.
- **Do** check a change in the demo at a phone's width and a desktop's before it ships (`node tools/shoot.mjs`).

### Don't:
- **Don't** print words, log text or numbers inside the paper as texture; patterned paper is dots, stripes and squares.
- **Don't** use glass, blur or translucent surfaces, or a plain or bright gradient ground.
- **Don't** round the corners of tiles, cards, bars, buttons or chips.
- **Don't** put a reading or a control in a scattered bit; the bits carry nothing.
- **Don't** say "offline" for a device: say it isn't answering. Don't leave a number without its noun.
- **Don't** add a dependency or a build step. One file, vanilla custom elements.
