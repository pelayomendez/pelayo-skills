#!/usr/bin/env bash
# reap-procs.sh — find (and optionally kill) CPU/GPU-heavy processes that outlived the
# session that launched them: vitest runs, dev servers, automation Chrome.
#
# Orphan = walking the parent chain reaches launchd (pid 1) without passing a live owner:
# a `claude` process, an editor, or a terminal (a tty). Anything with a live owner is
# someone's current work and is never killed, except owned vitest runs older than
# --stuck-min when --stuck is given.
#
# Processes only. Never touches files, worktrees, or git.
#
# Usage:  reap-procs.sh [--kill] [--dev] [--stuck] [--stuck-min N]
#   (none)       report only
#   --kill       kill orphaned vitest runs and orphaned automation Chrome/MCP
#   --dev        with --kill: also orphaned dev servers, unless they listen on a
#                protected port ($REAP_PROTECT_PORTS, space-separated, default none)
#   --stuck      with --kill: also vitest runs that still have an owner but are older
#                than --stuck-min minutes (default 20)
# Daemons (nx daemon) are reported, never killed: stop them cleanly in their repo.
# Exit:   always 0.

set -uo pipefail
die() { echo "reap-procs: $1" >&2; exit 2; }
alive() { kill -0 "$1" 2>/dev/null; }

KILL=0 DEV=0 STUCK=0 STUCK_MIN=20
while [ $# -gt 0 ]; do
  case "$1" in
    --kill) KILL=1 ;;
    --dev) DEV=1 ;;
    --stuck) STUCK=1 ;;
    --stuck-min) STUCK_MIN="${2:?--stuck-min needs a value}"; shift ;;
    *) die "unknown flag: $1" ;;
  esac
  shift
done
PROTECT_PORTS="${REAP_PROTECT_PORTS:-}"

LOG="${REAP_LOG:-${CLAUDE_CONFIG_DIR:-$HOME/.claude}/logs/reap-procs.log}"
mkdir -p "$(dirname "$LOG")"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Snapshot to a file first so the awk process (whose argv would match) is not in it.
ps -Ao pid=,ppid=,tty=,%cpu=,rss=,etime=,command= > "$TMP/ps"

cat > "$TMP/scan.awk" <<'AWK'
function secs(t,   d, n, a, s, i) {
  d = 0
  if (index(t, "-")) { split(t, a, "-"); d = a[1]; t = a[2] }
  n = split(t, a, ":"); s = 0
  for (i = 1; i <= n; i++) s = s * 60 + a[i]
  return d * 86400 + s
}
function klass(c) {
  if (c ~ OWNER || c ~ PLUMBING) return ""
  if (c ~ DAEMON) return "daemon"
  if (c ~ /vitest/) return "vitest"
  if (c ~ /chrome-devtools-mcp/) return "chrome"
  if (c ~ /rsbuild|(^|[ \/])vite( |$)|vite\/bin|next dev|webpack(-| )serve|storybook|esbuild --service/) return "dev"
  return ""
}
# pid of the live owner, "tty" for a terminal, "" for an orphan
function owner(p,   q) {
  for (q = p; (q in pp) && q > 1; q = pp[q]) {
    if (q == SELF) return "self"
    if (cmd[q] ~ OWNER) return q
    if (tty[q] != "??" && tty[q] != "?") return "tty"
  }
  return ""
}
# climb only through launch plumbing (shells, package runners) or same-class processes
function root(p, k,   q) {
  q = p
  while ((pp[q] in cmd) && pp[q] > 1 && (klass(cmd[pp[q]]) == k || cmd[pp[q]] ~ PLUMBING)) q = pp[q]
  return q
}
function tree(p,   out, n, a, i) {
  if (cmd[p] ~ DAEMON && klass(cmd[ROOT]) != "daemon") return ""
  out = p
  n = split(kids[p], a, " ")
  for (i = 1; i <= n; i++) out = out " " tree(a[i])
  return out
}
BEGIN {
  OWNER = "(^|/)claude( |$)|Claude\\.app|/codex( |$)|Visual Studio Code|Code Helper|Cursor|WebStorm|IntelliJ|/idea( |$)"
  DAEMON = "nx/src/daemon"
  PLUMBING = "^(/bin/|/usr/bin/)?(zsh|bash|sh) |^npm |^npx |^(pnpm|yarn) |/bin/(npm|npx|pnpm|yarn)( |$)|^node .*/(npm|npx)-cli"
}
{
  p = $1; pp[p] = $2; tty[p] = $3; cpu[p] = $4; rss[p] = $5; et[p] = $6
  c = $0; sub(/^ *[0-9]+ +[0-9]+ +[^ ]+ +[0-9.]+ +[0-9]+ +[^ ]+ +/, "", c); cmd[p] = c
  kids[$2] = kids[$2] " " p
  order[++N] = p
}
END {
  for (i = 1; i <= N; i++) {
    p = order[i]; k = klass(cmd[p]); if (k == "") continue
    o = owner(p)
    if (o == "self" || o == "tty") continue
    if (o == "") { status = "orphan"; r = root(p, k) }
    else if (k == "daemon") { status = "owned"; r = p }
    else if (k == "vitest" && cmd[p] !~ PLUMBING && cmd[p] !~ /\(vitest [0-9]+\)/ && secs(et[p]) > STUCKMIN * 60) { status = "stuck"; r = p }
    else continue
    if ((r in seen) || (p in seen)) continue
    ROOT = r; pids = tree(r); n = split(pids, a, " "); c = 0; m = 0
    # a tree that contains a live owner is a launcher (e.g. a detached worker wrapper), never an orphan
    hasowner = 0
    for (j = 1; j <= n; j++) if (cmd[a[j]] ~ OWNER) hasowner = 1
    if (hasowner) { for (j = 1; j <= n; j++) seen[a[j]] = 1; continue }
    for (j = 1; j <= n; j++) { seen[a[j]] = 1; c += cpu[a[j]]; m += rss[a[j]] }
    what = (k == "chrome") ? "automation Chrome / chrome-devtools-mcp" : substr(cmd[p], 1, 70)
    printf "%s|%s|%s|%s|%s|%.1f|%d|%s|%s|%s\n", k, status, r, p, (o == "" ? "-" : o), c, m / 1024, et[r], pids, what
  }
}
AWK

awk -v SELF=$$ -v STUCKMIN="$STUCK_MIN" -f "$TMP/scan.awk" "$TMP/ps" > "$TMP/found"

ports_of() {  # space-separated listening TCP ports of a pid list
  lsof -nP -a -p "$(echo "$1" | tr ' ' ',')" -iTCP -sTCP:LISTEN -Fn 2>/dev/null \
    | sed -n 's/^n.*:\([0-9][0-9]*\)$/\1/p' | sort -un | tr '\n' ' ' | sed 's/ $//'
}
project_of() {
  local cwd; cwd="$(lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
  [ -n "$cwd" ] && basename "$cwd" || echo "?"
}

TO_KILL=""
TOTAL_CPU=0
printf '%-8s %-7s %-6s %7s %6s %11s %-11s %-28s %s\n' ACTION CLASS PID CPU% MEM_MB AGE PORTS PROJECT WHAT
while IFS='|' read -r k status root cand owner cpu mem age pids what; do
  [ -n "$k" ] || continue
  ports="$(ports_of "$pids")"
  action=report
  if [ "$KILL" = 1 ]; then
    case "$k:$status" in
      vitest:orphan|chrome:orphan) action=kill ;;
      vitest:stuck) [ "$STUCK" = 1 ] && action=kill ;;
      dev:orphan)
        if [ "$DEV" = 1 ]; then
          action=kill
          for p in $ports; do case " $PROTECT_PORTS " in *" $p "*) action=protected ;; esac; done
        fi ;;
    esac
  fi
  label="$k"; [ "$status" = stuck ] && label="vitest*"
  printf '%-8s %-7s %-6s %7s %6s %11s %-11s %-28s %s\n' \
    "$action" "$label" "$root" "$cpu" "$mem" "$age" "${ports:--}" "$(project_of "$cand" | cut -c1-28)" "$what"
  if [ "$action" = kill ]; then
    TO_KILL="$TO_KILL $pids"
    echo "$(date -u +%FT%TZ) kill class=$k status=$status root=$root cpu=$cpu mem_mb=$mem age=$age pids=[$pids] what=$what" >> "$LOG"
  fi
  TOTAL_CPU="$(awk -v a="$TOTAL_CPU" -v b="$cpu" 'BEGIN{printf "%.1f", a+b}')"
done < "$TMP/found"

swap="$(sysctl -n vm.swapusage 2>/dev/null | awk '{print "swap " $6 " of " $3}')"
[ -z "$swap" ] && swap="$(free -h 2>/dev/null | awk '/^Swap:/{print "swap " $3 " of " $2}')"
load="$(sysctl -n vm.loadavg 2>/dev/null | tr -d '{}' || true)"
[ -z "$load" ] && load="$(cut -d' ' -f1-3 /proc/loadavg 2>/dev/null)"

count="$(grep -c . "$TMP/found" || true)"
if [ "$count" = 0 ]; then
  echo "reap-procs: nothing orphaned or stuck; ${swap:+$swap; }load $load"
  exit 0
fi

if [ -n "$TO_KILL" ]; then
  # shellcheck disable=SC2086
  kill -TERM $TO_KILL 2>/dev/null
  sleep 3
  survivors=""
  for p in $TO_KILL; do alive "$p" && survivors="$survivors $p"; done
  # shellcheck disable=SC2086
  [ -n "$survivors" ] && kill -KILL $survivors 2>/dev/null
  echo "reap-procs: killed $(echo $TO_KILL | wc -w | tr -d ' ') processes (SIGKILL needed for$(echo "${survivors:- none}"))"
fi
echo "reap-procs: $count group(s), ${TOTAL_CPU}% CPU total; ${swap:+$swap; }load $load"
[ "$KILL" = 0 ] && echo "reap-procs: report only; rerun with --kill (add --dev / --stuck to widen)"
exit 0
