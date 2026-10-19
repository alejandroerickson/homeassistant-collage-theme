---
name: okf-decision
description: Record, revise or supersede an architectural decision record in the Collage repository's okf/decisions/. Use when a change makes a durable choice (a technology, an interface with Home Assistant, how the theme or cards are built or installed, a design rule, a process rule), when the person states a decision that should outlive the conversation, when work would contradict an existing decision, or when asked why something is built the way it is and no record explains it.
---

# Record a decision in okf/decisions/

A decision record keeps a durable choice, its reasons and what it rules out, so that later work
does not reopen it by accident. If work contradicts a decision, the decision wins until it is
revisited explicitly.

## Does it need a record?

It does if **any** of these is true:

- A later change could reasonably go the other way, and someone would need to know why it did not.
- It constrains other work: code, schema, an API shape, the interface, deployment, or process.
- The owner decided it explicitly. Product and design calls, and anything about privacy, are the
  owner's to make. Record them. Do not make them yourself.

If the choice is only about how something looks, it belongs in `DESIGN.md`. Everything else that
is not durable goes in the code's comments.

## Before writing

1. Read `okf/decisions/index.md`. If a record already covers the area, revise it or supersede it.
   Do not add a second record that half-overlaps.
2. Read the documents the decision affects (`README.md`, `DESIGN.md`, `okf/process/`). They must
   agree with it once you are done.
3. If you are deciding for the owner on something that is theirs to decide, stop and ask.

## Write it

File: `okf/decisions/<the-choice-in-kebab-case>.md`. Name the choice, not the topic.
`only-public-home-assistant-interfaces.md` is a good name; `interfaces.md` is not.

```markdown
---
type: Decision
title: <The choice, stated as a sentence>
description: <One line: the choice and its main reason.>
tags: [decision, <area>, …]
generated: {by: agent:<your-name>, at: <YYYY-MM-DD>}
status: stable
---

# <Same as title>

## Context

<The forces: what problem, what constraints, what alternatives were live. Two to five sentences.
Present the situation; do not tell the story of a session.>

## Decision

- <What is chosen, concretely enough to check code against.>
- <Name the alternative that was rejected, and why, in one line, if that helps a later reader.>

## Consequences

- <What becomes easier, what becomes harder, what it costs.>

## Constrains

- <The rules this imposes on code or process, with paths: "every card is registered in `CARDS`
  in `dist/collage.js`".>
```

Keep it under about 40 lines. Link to the document with the detail rather than repeating it. If the owner
made the decision, say so and date it in Context, for example "The maintainer chose X on
2026-01-31".

Then:

1. Add a line to `okf/decisions/index.md`: `- [<title>](<file>.md)`.
2. Link the decision from the documents it governs.
3. Make those documents agree with the decision.
4. Run `python3 okf/tools/validate_okf.py`.

## Revise or supersede

- **Refining** a decision while its choice stays the same: edit it in place and bump
  `generated.at`.
- **Reversing or replacing** one: write the new record. On the old record, set
  `status: deprecated` and add a first line to its body:
  `Superseded on <date> by [<new title>](<new-file>.md).` Give the new record's Context a line on
  what it replaces and why. Keep both in the index until nothing links to the old one.
- **Code that contradicts a decision** is either a bug to fix or a sign the decision should change.
  Say which in your report. Never change a decision silently to match code you just wrote.

## Public repository

Records are published. Give reasons in terms of the theme and the people who use it. Never name private
projects, clients, conversations or people outside the repository, even when they shaped the
choice.
