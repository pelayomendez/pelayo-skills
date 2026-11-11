#!/usr/bin/env bash
# PreToolUse(Bash) guard for the charter's "never" tier: block recursive/forced
# deletes aimed at temp or home folders themselves (a sub-agent once ran rm over
# the temp root, taking other sessions' files with it). Needs jq; without it the
# guard does nothing.
cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

tmpdir=${TMPDIR%/}
home=${HOME%/}
# Quoted text containing spaces is prose (echo, commit messages): drop it.
# Quoted text without spaces is an operand ("$TMPDIR"): keep it, unquoted.
# Exception: quoted text that itself starts with rm/find is a nested command
# (sh -c "rm -rf /tmp"): keep it.
norm=$(printf '%s' "$cmd" | perl -pe 's/"(?!\s*(?:rm|find)\s)([^"]*\s[^"]*)"/ /g; s/\x27(?!\s*(?:rm|find)\s)([^\x27]*\s[^\x27]*)\x27/ /g; s/["\x27]//g')

# A protected root, optionally followed by "/", "/*" or "/.", then end of word.
# Literal $TMPDIR/$HOME values join the list only when set: an empty alternative
# makes grep reject the pattern, and a rejected pattern would let everything through.
extra=""
[ -n "$tmpdir" ] && extra="$extra|$tmpdir"
[ -n "$home" ] && extra="$extra|$home"
root="(\\\$TMPDIR|\\\$\\{TMPDIR\\}|/tmp|/private/tmp|/private/var/folders(/[^/[:space:]]+){0,3}|/var/folders(/[^/[:space:]]+){0,3}|~|\\\$HOME|\\\$\\{HOME\\}${extra}|/)(/|/\\*|/\\.|/\\.\\./?)?([[:space:];&|)]|$)"

# rm with -r/-R/-f flags whose operand list contains a protected root.
# rm (any path to it) with -r/-R/-f or --recursive/--force, whose operands include a protected root.
rm_re="(^|[;&|(\`[:space:]])([^;&|[:space:]]*/)?rm([[:space:]]+-[-[:alnum:]]*)*[[:space:]]+(-[[:alnum:]]*[rRf][[:alnum:]]*|--recursive|--force)([[:space:]]+-[-[:alnum:]]*)*([[:space:]]+[^;&|[:space:]]+)*[[:space:]]+${root}"
# find <protected root> ... -delete
find_re="(^|[;&|(\`[:space:]])find[[:space:]]+${root}.*-delete"

if printf '%s' "$norm" | grep -Eq "$rm_re" || printf '%s' "$norm" | grep -Eq "$find_re"; then
  echo "blocked: rm on a temp/home folder; delete only directories you created" >&2
  exit 2
fi
exit 0
