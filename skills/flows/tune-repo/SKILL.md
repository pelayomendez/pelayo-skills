---
name: tune-repo
description: "Audit one repository overnight across five areas (tests, architecture, dependencies, bundle size, and a retro on recent agent sessions), one worker per area, into a single ranked report you grill in the morning. Changes no code."
summary: "Audits a repo overnight into one report"
disable-model-invocation: true
argument-hint: "<repo> [tests,architecture,deps,bundle,retro]"
---

# Tune repo

`/tune-repo <repo> [areas]` audits one repository while you are away and leaves one ranked report for the morning. With no areas, all five run: `tests`, `architecture`, `deps`, `bundle`, `retro`. It asks nothing once it starts.

The run **ends at the report**. It changes no code, opens no MR, creates no ticket and posts nothing. In the morning you grill the report and decide, item by item: a ticket, a worker, or leave it.

It is a flow: every step is a unit that also works on its own, and this file only sets the order and where it stops.

## Units

Steps, in order:

- `charter`
- `reap-procs`
- `delegate`
- `verify-claim`
- `handoff`

Throughout:

- `deps-audit`
- `bundle-audit`

## Slots

Each area is a slot, so your own skill can do the job. Unset slots use your slots file, then the defaults. The contract they share, and the default methods, are in [references/areas.md](references/areas.md).

- `tests`: default, the tests method in `references/areas.md`
- `architecture`: default, the architecture method in `references/areas.md`
- `deps`: default, `deps-audit`
- `bundle`: default, `bundle-audit`
- `retro`: default, the retro method in `references/areas.md`

## Config

The flow config that lists the repo (under `## Repo` or `## Review`), in the folder where the user keeps flow configs. From it the flow takes `<tasks>`, the **load limits**, the **slots**, and, if there is one, a `## Tune` section: the build command and the files that hold the repo's own rules (architecture docs, ADRs, boundary configs, ratchet tests).

Each run gets one folder, `<run>` = `<tasks>/tune/<repo>-<short sha>/`: the area files (`tests.md`, `architecture.md`, `deps.md`, `bundle.md`, `retro.md`), one subfolder per area for its brief, log and PID (`<run>/<area>/`, as `delegate` names them), and the report `TUNE-<repo>-<short sha>.md`. The handoff is `<tasks>/tune/handoff-<date>.md`.

## Steps

**1. Find the config and the commit.** Find the flow config that lists the repo. **None: stop** and ask the user to add the repo to one (`<tasks>` and load limits at least). Read the areas from the argument; none means all five. `git fetch` the repo (fetch only: never check out, pull or touch the user's checkout) and take the base branch's SHA at `origin`; the whole run audits that one SHA.

**2. Permissions.** Run `charter` for scope `/tune-repo` on this repo: is fetching tools and running the repo's normal install inside a throwaway worktree granted? **Granted**: the briefs lift the install forbid for exactly that, naming the charter line. **Not granted**: the forbid stays; areas use only what the machine already has, and anything they couldn't run is listed as not run. The run never asks.

**3. Prepare the night.** Write the handoff with `handoff`: repo, SHA, areas, the slot each one uses, the charter lines in force, and the rules below. Keep the machine awake (macOS: `( caffeinate -ims -t 36000 & echo $! > <run>/caffeinate.pid )`). Arm the loop: `/loop` with no interval, with the prompt from [references/loop-prompt.md](references/loop-prompt.md) filled in.

**4. Each tick: launch, collect, retry.** Read the handoff, then:

- **Collect** each area worker that has exited (its PID gone): copy its area file from its worktree root into `<run>/<area>.md`, then remove that worktree (`git worktree remove`). No area file, or `failed` as the last line of its log: read the log; if the cause is something it can fix inside a worktree (a missing env var, a build flag, a tool it may fetch), launch that area **once more** with the fix in its brief. If it fails again, mark the area failed with the error and carry on.
- **Launch** the next waiting area with `delegate` when the load limits allow (one at a time when the config sets none; never two builds or two test suites at once). Preflight with `reap-procs` before each launch; on **wait**, launch nothing this tick. Audit workers commit nothing, so several may run in the same repo at once.
  - Worktree: `git worktree add --detach <run>/wt-<area> <sha>`.
  - Brief: the area's slot skill, the contract from `references/areas.md`, the area file to write at the worktree root (`TUNE-<area>.md`), the charter lines from step 2, and the rules below word for word. A skill in a slot that you type rather than the agent picks up (like a `retro` command) goes in the brief as its `SKILL.md` path to read and follow.
  - The `retro` worker also gets read access to the agent's session logs: launch it with `--add-dir <sessions folder>` (for Claude Code, `~/.claude/projects`).
- Log one line per launch, exit and retry in the handoff. When every area is collected or failed, go to step 5.

**5. Rank and check.** From the area files, rank every finding across areas by value (high, medium or low, from its area) against effort (S, M or L), and take the top 5. Pass the top 5 and every finding marked high value to `verify-claim`, each as "<finding> at <evidence>", with what would refute it. A refuted top finding drops out of the top 5, stays in its area with the refutation, and the next one moves up. Mark each checked finding ✓; every other one is `?` (unverified).

**6. Write the report**, `<run>/TUNE-<repo>-<short sha>.md`. It stands alone: no comparison with earlier runs.

- **Header**: repo, SHA, date, the areas run, the slot each used, the areas skipped or failed and why, and every tool fetched into a worktree.
- **Top 5**: across all areas, one line each.
- **One section per area**: every finding, ranked, each with its id (`T1`, `A1`, `D1`, `B1`, `R1`…), the evidence (file and line, numbers, command output), ✓ or `?`, value, effort, and the suggested action: ticket, worker, ratchet, or rule (agent docs, lint, coding standards).
- **Baseline numbers** each area reported (test count and time, bundle size, unused dependencies, boundary violations).
- **Decision table**: one row per finding id, the decision column empty: `ticket`, `worker` or `leave`, filled in during the grill.

**7. Stop: the morning.** Put `## Morning report` at the top of the handoff, under 150 words: the report's path, the top 5 in a line each, the areas that failed. Stop the loop and the keep-awake (`kill $(cat <run>/caffeinate.pid)`), and make sure no worktree the run made is left (`git worktree list`). Then stop and wait: the user grills the report and decides each item. Tickets and workers start only on the user's word, outside this run.

## When a step fails

- **No config lists the repo**: stop before anything is launched (step 1).
- **An area fails twice**: it is marked failed in the report with the error from its log. Never present an area that didn't run as clean.
- **The machine is busy** (`reap-procs` says wait): don't launch; check again on the next tick.
- **The loop dies or the session ends**: the handoff and the area files are enough to resume; a new session reads the handoff and goes on from step 4.

## Rules

Every brief carries these, word for word:

- Never commit, push, open an MR or PR, comment, approve, or write to the tracker.
- Work only in your own throwaway worktree at the given SHA, and write your findings to `TUNE-<area>.md` at its root. Anything you change there to test a hunch (a mutation, a build flag) you undo by editing it back, then check with `git diff` that nothing is left.
- Install nothing globally. Install or fetch tools in your worktree only if your brief names the charter line that allows it, and write down every tool you fetch and its version. Never install through a symlinked `node_modules`.
- One test suite and one build at a time, within the load limits. Never kill a process by name.
- Read-only on everything outside your worktree, including the agent's session logs the retro reads.
- Last line of your log: `WORKER_EXIT 0`, or `failed <reason>`.
