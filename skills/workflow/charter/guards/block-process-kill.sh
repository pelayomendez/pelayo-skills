#!/usr/bin/env bash
# PreToolUse(Bash) guard for the charter's "never" tier: block pattern-based
# process kills. pkill/killall match every process on the machine, other
# sessions' work and endpoint-security sensors included (one such run was
# flagged as tampering with the sensor). Stop processes by PID, or by the PID
# listening on a port: `lsof -tiTCP:<port> -sTCP:LISTEN`. Needs jq; without it
# the guard does nothing.
cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Quoted text containing spaces is prose (echo, commit messages): drop it.
# Exception: quoted text that itself starts with pkill/killall is a nested
# command (sh -c "pkill node"): keep it.
norm=$(printf '%s' "$cmd" | perl -pe 's/"(?!\s*(?:pkill|killall)\s)([^"]*\s[^"]*)"/ /g; s/\x27(?!\s*(?:pkill|killall)\s)([^\x27]*\s[^\x27]*)\x27/ /g; s/["\x27]//g')

# Command position only: start, after ; & | ( ` or a command prefix.
# Command position: start, after ; & | ( { ` or a command prefix (env, command, nice, VAR=x…),
# with or without a path (/usr/bin/pkill).
start="(^|[;&|({\`]|(-c|do|then|else|xargs|sudo|exec|nohup|time|env|command|builtin|nice|timeout[[:space:]]+[0-9]+|[A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*)[[:space:]])[[:space:]]*([^;&|[:space:]]*/)?"
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
