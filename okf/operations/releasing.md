---
type: Process
title: Releasing a version
description: How a version is numbered, tagged and published so HACS offers it.
tags: [operations, release, hacs]
generated: {by: agent:claude, at: 2026-10-18}
status: stable
---

# Releasing

HACS offers the repository's GitHub releases; a user installs or updates to a tag
([decision](../decisions/cards-through-hacs-theme-copied.md)).

1. `main` is green in CI.
2. Set `VERSION` at the top of `dist/collage.js`, [semantic versioning](https://semver.org/): a
   card option renamed or removed is a major version, a new card or option a minor one.
3. Commit, push, then tag and publish:

   ```sh
   gh release create v<version> --title v<version> --generate-notes
   ```

4. Read the generated notes and rewrite them for someone running a home: what they will see, and
   anything they must change (a renamed option, a theme variable to copy again).

A release is never moved or deleted once published; a fix is a new version.
