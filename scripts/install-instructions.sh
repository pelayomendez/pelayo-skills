#!/usr/bin/env bash
set -euo pipefail

# Installs every file in instructions/ as an always-on import in the global
# agent config. Symlinks rather than copies, so editing this repo takes effect
# immediately with no update step.
#
#   ./scripts/install-instructions.sh            # install into ~/.claude
#   ./scripts/install-instructions.sh --dry-run  # show what would change
#   AGENT_HOME=~/.codex ./scripts/install-instructions.sh
#
# Idempotent: re-running changes nothing. Never edits an existing @import line,
# never removes anything it didn't add.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
AGENT_HOME="${AGENT_HOME:-$HOME/.claude}"
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

MEMORY="$AGENT_HOME/CLAUDE.md"
[[ -d "$AGENT_HOME" ]] || { echo "✗ $AGENT_HOME does not exist" >&2; exit 1; }

shopt -s nullglob
files=("$REPO"/instructions/*.md)
(( ${#files[@]} )) || { echo "✗ no instruction files in $REPO/instructions" >&2; exit 1; }

run() { if (( DRY_RUN )); then echo "  would: $*"; else "$@"; fi; }

for src in "${files[@]}"; do
  base="$(basename "$src")"
  dest="$AGENT_HOME/$base"

  if [[ -L "$dest" && "$(readlink "$dest")" == "$src" ]]; then
    echo "= $base already linked"
  elif [[ -e "$dest" && ! -L "$dest" ]]; then
    # A real file is in the way — back it up rather than clobber it.
    echo "! $base exists as a regular file; backing up to $base.bak"
    run mv "$dest" "$dest.bak"
    run ln -s "$src" "$dest"
    echo "+ $base linked"
  else
    run ln -sfn "$src" "$dest"
    echo "+ $base linked"
  fi

  if [[ -f "$MEMORY" ]] && grep -qxF "@$base" "$MEMORY"; then
    echo "= @$base already imported in ${MEMORY/#$HOME/~}"
  else
    run bash -c "printf '@%s\n' '$base' >> '$MEMORY'"
    echo "+ @$base imported in ${MEMORY/#$HOME/~}"
  fi
done

(( DRY_RUN )) && echo "(dry run — nothing written)"
echo "Done. Open a new session for the import to take effect."
