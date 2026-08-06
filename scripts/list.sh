#!/usr/bin/env bash
set -euo pipefail

# Lists everything this repo installs, by invocation mode.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

shopt -s nullglob
for doc in instructions/*.md; do
  printf "%-16s %s\n" "always-on" "$doc"
done

[[ -d skills ]] || exit 0

find skills -name SKILL.md -not -path '*/node_modules/*' | sort | while read -r s; do
  if grep -q 'disable-model-invocation: true' "$s"; then
    mode="user-invoke-only"
  else
    mode="model-invocable"
  fi
  printf "%-16s %s\n" "$mode" "$(dirname "$s")"
done
