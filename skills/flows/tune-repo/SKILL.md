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

- `reap-procs`
- `delegate`
- `verify-claim`
- `handoff`

Throughout:

- `charter`
- `deps-audit`
- `bundle-audit`

## Slots

Each area is a slot, so your own skill can do the job. Unset slots use your slots file, then the defaults. The contract they share is in [references/areas.md](references/areas.md).

- `tests`: default, the test method in `references/areas.md`
- `architecture`: default, the architecture method in `references/areas.md`
- `deps`: default, `deps-audit`
- `bundle`: default, `bundle-audit`
- `retro`: default, the retro method in `references/areas.md`

## Config

The flow config that lists the repo (under `## Repo` or `## Review`), in the folder where the user keeps flow configs. From it the flow takes `<tasks>`, the **load limits**, the **slots**, and, if there is one, a `## Tune` section: the build command and the files that hold the repo's own rules (architecture docs, ADRs, boundary configs, ratchet tests).

Everything goes in `<tasks>/tune/`: one folder per run, `<tasks>/tune/<repo>-<short sha>/`, with one file per area (`tests.md`, `architecture.md`, `deps.md`, `bundle.md`, `retro.md`), the worker records `delegate` writes, and the report `TUNE-<repo>-<short sha>.md`. The handoff is `<tasks>/tune/handoff-<date>.md`.

## Steps

**1. Find the config.** Find the flow config that lists the repo. **None: stop** and ask the user to add the repo to one (`<tasks>` and load limits at least). Read the areas from the argument; none means all five. Resolve the commit: the repo's base branch at `origin`, fetched now; the whole run audits that one SHA.

**2. Prepare the night.** Write the handoff with `handoff`: repo, SHA, areas, the slot each one uses, and the rules in force (below). Keep the machine awake (macOS: `( caffeinate -ims -t 36000 & echo $! > <tasks>/tune/caffeinate.pid )`). Preflight with `reap-procs`; on **wait**, wait and check again before launching anything.

**3. Launch one worker per area** with `delegate`, each in its own throwaway worktree at the SHA, never more at once than the load limits allow (one at a time when the config sets none), and never two builds or two test suites at once. Each brief names the area's slot skill, the contract from `references/areas.md`, the area file it writes, and the forbids below word for word. A skill in a slot that you type rather than the agent picks up (for example a `retro` skill) goes in the brief as its file to read and follow.

**4. Collect.** Wait on the workers as `delegate` describes (a `/loop` with no interval keeps the session going through the night). When a worker ends without its area file, or with the area marked failed, read its log; if the cause is something it could fix inside its worktree (a missing env var, a build flag, a tool to fetch there), launch it **once more** with that fix in the brief. If it fails again, the area is marked failed with the error, and the others carry on.

**5. Write the report**, `TUNE-<repo>-<short sha>.md`, from the area files:

- **Header**: repo, SHA, date, the areas run, the slot each used, the areas skipped or failed and why, and every tool fetched into a worktree.
- **Top 5**: across all areas, by value against effort.
- **One section per area**: every finding, ranked, each with its id (`T1`, `A1`, `D1`, `B1`, `R1`…), the evidence (file and line, numbers, command output), ✓ checked or `?` unverified, value, effort (S, M or L), and the suggested action: ticket, worker, ratchet, or rule (CLAUDE.md, lint, coding standards).
- **Baseline numbers** each area reported (test count and time, bundle size, unused dependencies, boundary violations).
- **Decision table**: one row per finding id, the decision column empty: `ticket`, `worker` or `leave`, filled in during the grill.

**6. Check the top.** Pass the top 5 and every finding marked high value to `verify-claim`, each as "<finding> at <evidence>", with what would refute it. Mark each ✓ or `?`; the rest stay `?` (unverified). Each report stands alone: no comparison with earlier runs.

**7. Stop: the morning.** Put `## Morning report` at the top of the handoff, under 150 words: the report's path, the top 5 in a line each, the areas that failed. Stop the keep-awake (`kill $(cat <tasks>/tune/caffeinate.pid)`) and make sure every worktree the run made is removed. Then stop and wait: the user grills the report and decides each item. Tickets and workers start only on the user's word, outside this run.

## When a step fails

- **No config lists the repo**: stop before anything is launched (step 1).
- **An area fails twice**: it is marked failed in the report with the error from its log. Never present an area that didn't run as clean.
- **The machine is busy** (`reap-procs` says wait): don't launch; check again on the next tick.
- **`verify-claim` refutes a top finding**: it drops out of the top 5, stays in its area with the refutation, and the next one moves up.

## Rules

Every brief carries these, word for word:

- Never commit, push, open an MR or PR, comment, approve, or write to the tracker.
- Work only in your own throwaway worktree at the given SHA. A tool the repo lacks may be fetched there (`npx`, or a dev dependency never committed); never install anything globally. Write down every tool you fetch and its version.
- One test suite and one build at a time, within the load limits. Never kill a process by name.
- Read-only on everything outside your worktree, including the agent's session logs the retro reads.
