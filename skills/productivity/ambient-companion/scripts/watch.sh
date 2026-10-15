#!/usr/bin/env bash
# Model-free watcher: the bottom rung of the trigger ladder.
#
# Runs a command every <interval> seconds and exits as soon as its output
# differs from the first run, printing the new output. Run it as a background
# command: its exit is what wakes the companion, so no model tokens are spent
# while nothing changes.
#
# Usage:
#   watch.sh <interval-seconds> <command> [args...]
# Examples:
#   watch.sh 300 git ls-remote origin refs/heads/main
#   watch.sh 120 glab mr view 42 -F json --jq .state
#
# Writes a heartbeat to $WATCH_HEARTBEAT (default .companion/heartbeat) on
# every poll, so a stalled watcher is visible. Exits 1 if the command fails
# three times in a row, so a broken watch wakes the session instead of
# hanging silently.

set -uo pipefail

interval="${1:?usage: watch.sh <interval-seconds> <command> [args...]}"
shift
[ $# -gt 0 ] || { echo "watch.sh: no command given" >&2; exit 2; }

heartbeat="${WATCH_HEARTBEAT:-.companion/heartbeat}"
mkdir -p "$(dirname "$heartbeat")"

baseline=$("$@" 2>/dev/null) || { echo "watch.sh: command failed on first run: $*" >&2; exit 1; }
failures=0

while true; do
  sleep "$interval"
  date -u +"%Y-%m-%dT%H:%M:%SZ $*" > "$heartbeat"
  if current=$("$@" 2>/dev/null); then
    failures=0
    if [ "$current" != "$baseline" ]; then
      echo "changed: $*"
      printf '%s\n' "$current"
      exit 0
    fi
  else
    failures=$((failures + 1))
    if [ "$failures" -ge 3 ]; then
      echo "watch.sh: command failed 3 times in a row: $*" >&2
      exit 1
    fi
  fi
done
