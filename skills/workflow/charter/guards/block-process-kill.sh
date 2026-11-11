#!/usr/bin/env bash
# PreToolUse(Bash) guard: block pattern-based process kills (added 2026-10-19
# after Microsoft Defender flagged a sub-agent's `pkill -f "rsbuild dev" -P 1`
# as tampering with its sensor). pkill/killall scan every process, Defender's
# own included, so each run raises a security alert. Stop processes by PID, or
# by the PID listening on a port: `lsof -tiTCP:<port> -sTCP:LISTEN`.
cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Quoted text containing spaces is prose (echo, commit messages): drop it.
# Exception: quoted text that itself starts with pkill/killall is a nested
# command (sh -c "pkill node"): keep it.
norm=$(printf '%s' "$cmd" | perl -pe 's/"(?!\s*(?:pkill|killall)\s)([^"]*\s[^"]*)"/ /g; s/\x27(?!\s*(?:pkill|killall)\s)([^\x27]*\s[^\x27]*)\x27/ /g; s/["\x27]//g')

# Command position only: start, after ; & | ( ` or a command prefix.
start="(^|[;&|(\`]|(-c|do|then|else|xargs|sudo|exec|nohup|time|timeout[[:space:]]+[0-9]+)[[:space:]])[[:space:]]*"
if printf '%s' "$norm" | grep -Eq "${start}(pkill|killall)([[:space:]]|$)"; then
  echo "blocked: pkill/killall trips the endpoint security sensor; kill only your own processes by PID (or the PID from lsof -tiTCP:<port> -sTCP:LISTEN)" >&2
  exit 2
fi

# kill fed by lsof without -sTCP:LISTEN also hits clients of that port
# (browsers, network filters), not just the server.
if printf '%s' "$norm" | grep -Eq 'lsof[^;&|]*-[[:alnum:]]*t' \
  && printf '%s' "$norm" | grep -Eq "${start}kill([[:space:]]|$)" \
  && ! printf '%s' "$norm" | grep -Eq 'sTCP:LISTEN'; then
  echo "blocked: kill fed by lsof without -sTCP:LISTEN also kills the port's clients; use lsof -tiTCP:<port> -sTCP:LISTEN" >&2
  exit 2
fi
exit 0
