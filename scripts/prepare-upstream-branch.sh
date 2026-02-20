#!/usr/bin/env bash
set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $(basename "$0") <upstream-branch-name>" >&2
  exit 1
fi

UPSTREAM_REPO="${UPSTREAM_REPO:-/Users/luke/Developer/raycast-extensions-upstream}"
BRANCH="$1"

git -C "$UPSTREAM_REPO" fetch upstream
git -C "$UPSTREAM_REPO" checkout -B "$BRANCH" upstream/main

echo "Prepared $UPSTREAM_REPO on branch $BRANCH from upstream/main"
