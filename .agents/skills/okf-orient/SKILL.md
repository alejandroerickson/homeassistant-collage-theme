---
name: okf-orient
description: Find and read the Collage repository's documentation before working. Use at the start of any task in this repository, before answering how the theme or a card works or why it is built that way, before planning or changing code, and whenever you are unsure which decision governs something.
---

# Orient in the okf/ bundle

The repository's documentation is in three places: `README.md` (what each card does and its
options), `DESIGN.md` and `PRODUCT.md` (the design system and the brief), and `okf/` (decisions and
how work is done). Read the part your task needs before you plan or edit.

## Read in this order, and stop when you have enough

1. `okf/index.md`: the map.
2. `okf/project/charter.md`: what Collage is for, and is not.
3. `okf/process/working-in-this-repository.md`, before changing anything.
4. The decisions in `okf/decisions/` that govern the area you are touching.
5. `DESIGN.md` before anything visual; the README's section for the card you are touching.

## Where each answer lives

| You need | Read |
|---|---|
| What a card shows and its options | `README.md` |
| How it should look, colour meanings, the rules | `DESIGN.md` |
| Who it is for, the principles | `PRODUCT.md` |
| Why something is built the way it is | `okf/decisions/index.md`, then the record |
| What is built, what is next | `okf/project/roadmap.md` |
| Running the demo, screenshots, checks | `okf/operations/local-development.md` |
| Releasing for HACS | `okf/operations/releasing.md` |
| What may never be committed, and the checks | `okf/operations/security-checks.md` |

## When sources disagree

- **Code** is the truth about what the cards do now.
- A **decision** is the truth about what they should do. If code contradicts one, tell the person,
  and fix the code or revise the decision with `okf-decision`.
- `DESIGN.md` is the truth about the look; correct it in the same change as a deliberate change.
- The **charter** has final authority on intent.

## After you orient

- Before finishing any change, use `okf-update`.
- When the work makes or reverses a durable choice, use `okf-decision`.
- Never write session notes, task logs or to-do lists into the repository. It is public.
