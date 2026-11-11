---
name: tidy
description: "Regular tune-up of your agent setup: retro on the sessions that went badly, prune memory, audit steering files, skills, permissions and hooks, then log the pass and set the next one."
disable-model-invocation: true
argument-hint: "[weekly|monthly]"
---

# Tidy

`/tidy [weekly|monthly]` — a maintenance pass over the agent's own environment, not over any codebase. Default: whichever pass is due (see **State**); monthly includes weekly.

An agent setup only grows. Memory piles up, steering files collect rules nobody needs, skills and plugins stay installed after their last use. This pass is where things get *removed*. Judge every step by whether the setup ends smaller and sharper than it started.

## Rules

- **Propose, then apply.** Present each step's findings as a short list of concrete edits; apply only the ones the user picks. Deleting a memory, skill, hook or worktree needs an explicit yes for that item.
- **Never invent findings.** Every proposal points at a file, a line, or a session. Drop anything generic.
- **Rules move down the ladder, not up.** A rule that keeps getting broken becomes a hook or a check; a procedure becomes a skill; a judgement call goes to the reviewer's standards. Moving a rule *into* an always-loaded file needs a reason that no cheaper place works.
- One step at a time. Show its findings, take the user's picks, apply, move on.

## Weekly

1. **Retro.** Ask which one or two recent sessions went badly (a failed run, a loop, a wrong fix). Run the `/retro` skill on each if it is installed; if not, say it comes from `mattpocock/skills` and do a short retro yourself over that session's transcript under `<config>/projects/`: where did the agent search too long, make a mistake a tool could catch, or lack access to something? Skip a smooth week.
2. **Memory.** For each memory directory under `<config>/projects/*/memory/` touched since the last pass (`<config>` is `$CLAUDE_CONFIG_DIR`, default `~/.claude`):
   - Size of `MEMORY.md`: only the first 200 lines / 25 KB load. Flag any index near that.
   - **Stale**: project facts about work that has finished, dates long past, files or flags that no longer exist (check them).
   - **Duplicate or contradictory** entries, within one directory and across directories for the same project.
   - **Misplaced**: a memory that is really a rule for every session (→ propose a hook or a steering-file line), a procedure (→ a skill), or derivable from the code or git history (→ delete).
   Keep the index in step with any file you delete or merge.

## Monthly

Do the weekly steps, then:

3. **Built-in checks.** Ask the user to run, in this session, the ones their Claude Code version has: `/doctor`, `/doctor prompt-audit`, `/skill-doctor`, `/insights`, `/fewer-permission-prompts`. They are commands only the user can type. Then turn their output into the same propose-then-apply list.
4. **Steering files.** Global `CLAUDE.md` and everything it `@import`s (imports load in full; they organise, they don't save context). Flag lines that change nothing, rules contradicted elsewhere, rules duplicated in a skill, and anything past ~200 lines total. Propose deletions first.
5. **Skills, plugins, MCP servers, hooks.** List what is installed. For each, when was it last used (transcripts, `/skill-doctor`)? Propose removing what has not been used since the last monthly pass, and any hook that encodes a preference rather than a hard rule.
6. **Leftovers.** `git worktree list` in the repos the user names: prunable entries and worktrees whose branch is merged. Long-running processes from dead sessions: run the `/reap-procs` skill if installed. Report, then clean only what the user picks.
7. **Charter.** If the user keeps a charter ledger (the `charter` skill), remove lines past their `until` and revoked ones, flag contradictions at equal scope, and propose a guard for any never that was broken since the last pass.
8. **Cost.** If a usage tool is already installed (`ccusage`, `rtk gain`, …) show the month's trend in one line. Never install one.

## State

State lives in `<config>/tidy/` (`$TIDY_HOME` overrides):

- `state` — two lines, ISO dates: `weekly YYYY-MM-DD` and `monthly YYYY-MM-DD`, the day each pass is next due.
- `log.md` — one line per pass: `YYYY-MM-DD weekly|monthly — <what changed, in a phrase>`.

At the end of a pass, append to `log.md` and move `state` forward: weekly due = today + 7 days; after a monthly pass also monthly due = today + 30 days. To schedule a pass for a given day, write that date into `state`.

The plugin's session-start hook reads `state` and prints a one-line reminder when a pass is due. It costs no context and never runs the pass itself: tidying takes judgement, so it stays user-invoked. `TIDY_REMIND=0` silences it.

## Report

End with at most five lines: what was removed, what was added (and where on the ladder), what was left for later, the next due dates.
