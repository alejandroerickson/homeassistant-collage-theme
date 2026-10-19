#!/bin/sh
# Set up a checkout: the git hooks that keep private material out of this public repository
# (okf/operations/security-checks.md). Nothing else to install: the demo needs Node and Chrome.
set -eu
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
command -v gitleaks >/dev/null || echo "bootstrap: install gitleaks (brew install gitleaks) so commits are checked for secrets."
echo "bootstrap: ready. Run the demo with: node tools/serve.mjs"
