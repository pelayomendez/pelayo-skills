#!/usr/bin/env bash
# SessionStart hook: one-line reminder when a /tidy pass is due. Never runs the pass.
# Reads <config>/tidy/state ("weekly YYYY-MM-DD" / "monthly YYYY-MM-DD", the next due dates).
# First run: creates state with weekly due in 7 days and monthly in 30, and stays quiet.
# Silence with TIDY_REMIND=0. Always exits 0 and prints nothing unless a pass is due.

[ "${TIDY_REMIND:-1}" = 0 ] && exit 0
dir="${TIDY_HOME:-${CLAUDE_CONFIG_DIR:-$HOME/.claude}/tidy}"
state="$dir/state"
today="$(date +%F)"

plus_days() { date -v+"$1"d +%F 2>/dev/null || date -d "+$1 days" +%F 2>/dev/null; }

if [ ! -f "$state" ]; then
  mkdir -p "$dir" 2>/dev/null || exit 0
  w="$(plus_days 7)"; m="$(plus_days 30)"
  [ -n "$w" ] && [ -n "$m" ] && printf 'weekly %s\nmonthly %s\n' "$w" "$m" > "$state"
  exit 0
fi

weekly="$(awk '$1=="weekly"{print $2}' "$state")"
monthly="$(awk '$1=="monthly"{print $2}' "$state")"

due=""
if [ -n "$monthly" ] && [[ ! "$today" < "$monthly" ]]; then due="monthly (due $monthly)"
elif [ -n "$weekly" ] && [[ ! "$today" < "$weekly" ]]; then due="weekly (due $weekly)"
fi
[ -z "$due" ] && exit 0

printf '{"systemMessage":"tidy: a %s pass is due. Run /tidy when you have 15 minutes."}\n' "$due"
exit 0
