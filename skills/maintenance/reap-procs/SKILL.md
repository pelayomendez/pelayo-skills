---
name: reap-procs
description: "Find what is eating the machine after agent sessions — orphaned test runs, dev servers, automation Chrome, old daemons, stale worktrees — attribute each to its session, and stop only what nobody owns. Also a preflight that says go or wait before several agents start. Use when the machine is slow, swapping, fans are loud, the user asks about leftover vitest/node/Chrome processes, or before launching several agents at once."
argument-hint: "[preflight] | [--kill] [--dev] [--stuck] [--stuck-min N]"
allowed-tools: Bash
---

# Reap procs

Built on macOS; the script also runs on Linux (`ps`, `free`, `/proc/loadavg`).

Agent sessions start processes that can outlive them: test runs, dev servers, the automation browser, build daemons, worktrees. This skill finds them, says whose they are, and stops only what has no live owner.

## Rules

- **Never stop another session's work.** Anything with a live owner — a running `claude`, an editor, a terminal — is reported with its session and worktree, and left alone.
- **Report first.** Without `--kill`, nothing is touched. If there are reapable rows, show them and ask before re-running with `--kill`. Never add `--dev` or `--stuck` on your own.
- **Clean stop before kill.** A daemon gets its own stop command, a browser page goes to `about:blank`, a worktree goes through `git worktree remove`. Raw `kill` is for orphans only. Never `pkill`/`killall` by name: it can't tell whose a process is.
- **Protected rows** (a dev server on a port in `REAP_PROTECT_PORTS`): list them and stop there.

## Run

```bash
scripts/reap-procs.sh $ARGUMENTS
```

Show its table as-is, then one line: groups found, swap, what was stopped. For `preflight`, don't pass it to the script: follow **Preflight** below.

| Class | Stopped by `--kill` | Notes |
|---|---|---|
| `vitest` orphan | yes | a test run never needs to outlive its launcher |
| `chrome` orphan | yes | only the automation profile (chrome-devtools-mcp), never the user's own browser |
| `dev` orphan | only with `--dev` | skipped when listening on a protected port |
| `vitest*` stuck | only with `--stuck` | owned run older than `--stuck-min` (default 20); stops the run, not its owner |
| `daemon` | never, and never as part of another group | e.g. the nx daemon; stop it cleanly with `npx nx daemon --stop` in its repo, after asking |

## Preflight

`preflight`: before launching several agents at once, say whether the machine can take them. It reads only. **Never stop anything in preflight**, not even an orphan: report it, and leave the reaping to a normal run.

Check, in this order:

1. **Swap**: `sysctl -n vm.swapusage` (macOS) or `free -h` (Linux). Swap in use and growing means wait.
2. **Load against cores**: `uptime` and `sysctl -n hw.ncpu` (or `nproc`). Count running test suites and type checks with the command count below; one already running in the same large repo means wait.
3. **Listening ports**: `lsof -iTCP -sTCP:LISTEN -P -n`. A port the new agents need, held by another session, means wait.
4. **Browsers held by other sessions**: automation Chrome (chrome-devtools-mcp) with a live owner. If the new agents need that profile, wait, or use another instance.
5. **Stale worktrees**: `git worktree list` in the target repos. Prunable entries, or a worktree already on the branch a new agent would create, mean wait until they are cleared.

Then `scripts/reap-procs.sh` with no flags, for orphans worth reaping first.

Report one line, **go** or **wait**, with the reason and what would turn a wait into a go ("wait: swap 6 of 8 GB and a type check running in the same repo; go once it finishes"). Name each finding's owner, as below.

## Read the machine right

- **Swap is the signal, not load.** `sysctl -n vm.swapusage` (macOS) or `free -h` (Linux). Load average lags and misleads; a machine at full swap is in trouble whatever the load says.
- **Resident memory understates.** A process that is swapped out looks small. Rank suspects by age and type, not by RSS alone.
- **Count by command** to spot fan-out: `ps -Ao rss=,command= | awk '{ $1=""; print }' | sed 's/ [0-9][0-9]*$//' | sort | uniq -c | sort -rn | head` — ten `node (vitest N)` workers means an agent is running suites in parallel.

## Whose is it

For any process you are about to report:

1. **Worktree**: `lsof -a -p <pid> -d cwd -Fn`.
2. **Session**: match that path against the session transcripts under `<config>/projects/<dir>/*.jsonl` (`<config>` is `$CLAUDE_CONFIG_DIR`, default `~/.claude`; check every config directory the user has). The newest file whose `cwd` matches, and its first prompt, name the session.
3. **Owner alive?** Walk the parent chain (the script does this). A git hook's test run (`.githooks/pre-commit` → vitest) inside another session's worktree belongs to that session: it ends on its own.

## Beyond the script

Report these; stop them only with the user's yes:

- **Idle agent sessions** open for days (`claude --resume`/`--continue`, high memory, no CPU). They may hold unsaved work: point the user at them, never stop them.
- **The automation browser parked on a heavy page** (a 3D scene keeps rendering unwatched): navigate it to `about:blank`.
- **Editor language servers** for old worktrees (`typescript-language-server` and the like) usually belong to an editor: report.
- **Stale worktrees**: `git worktree list` shows `prunable` entries and temporary trees (e.g. mutation-testing copies). Prune the prunable ones; remove others only when the user confirms nothing references them.

## Schedule

The script is safe to run unattended with `--kill` (orphans only, logged). Example for macOS launchd, every 15 minutes, in `references/launchd.plist`. Kills are logged to `$REAP_LOG` (default `<config>/logs/reap-procs.log`): on a slow machine, check that log first.
