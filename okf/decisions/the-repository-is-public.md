---
type: Decision
title: The repository is public; nothing from a real home
description: Everything committed is published, so no real home's entities, names, places, secrets or session memory go in.
tags: [decision, privacy, public, process]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# The repository is public; nothing from a real home

## Context

The theme began as one household's dashboard, and a home's configuration says who lives there, what
they own and when they are in. The repository is meant to be public, and history goes wherever the
repository goes.

## Decision

- Nothing from a real home: the demo, examples and screenshots use made-up entities and people. A
  screenshot shows the demo and nothing else, lives in `docs/media/`, and is reviewed by the
  maintainer before it is committed.
- No secrets, local paths, private network addresses, coordinates of anyone's home or personal
  details. No logs, session notes, requests or to-do lists; planned work goes in the
  [roadmap](../project/roadmap.md). Agents keep memory outside the repository.
- `okf/` holds reference knowledge only; `okf/log.md` is ignored.

## Consequences

- A check at commit, at push and in CI refuses what this rules out, and reads a private deny list
  that only the maintainer's checkout has ([security checks](../operations/security-checks.md)).
- The demo's home point is a public place (the middle of a city), chosen by the viewer's time zone.

## Constrains

- `scripts/check_publishable.py` lists the places files and images may be; a new one is added there.

Specified in: [working in this repository](../process/working-in-this-repository.md).
