---
name: support
description: "Work a bug queue end to end: qualify the bugs, then one at a time pick, fix with a worker, review, check in the browser, ship, check again on the test environment and close, with the status board updated at every step. Stops for your OK on merges and anything posted under your name."
disable-model-invocation: true
argument-hint: "<config file> [KEY ...] [--qualify-only]"
---

# Support

`/support <config>` takes the open bugs of one intake (for example a bug epic) and moves them, one at a time, from report to released. It is a flow: every step is a unit that also works on its own, and this file only sets the order, where it stops for you, and what happens when a step fails.

## Units

Steps, in order:

- `qualify`
- `ticket-pick`
- `delegate`
- `ui-check`
- `watch`

Throughout:

- `charter`
- `tracker-move`
- `verify-claim`
- `handoff`

One run folder per bug, `<tasks>/<KEY>/`, holds the brief, the worker log, `REVIEW-<KEY>.md`, `check-<KEY>.md` and the `UI-<KEY>-*.md` reports, so a run survives a `/clear`.

## Config

One file per installation, named in the argument. Ask once for anything missing and write it there.

- **Tracker**: the intake (epic, label or query), the ready labels, the transitions (In Progress, In Review, Done), sprint and points fields, the user's account id.
- **Board**: the ticket and heading of the status board, and its section names, for `tracker-move`.
- **Repo**: path, base branch, worktree and branch naming, the push and MR commands.
- **Workers**: the implementer and reviewer agents, and the guard tests every review must run.
- **Load limits**: how tests may run locally (for example one test command at a time, no full type check), and how many agents may work in the repo at once.
- **App**: start command, port, the URL to open first, the test project, and what the check may do there.
- **Release**: how a merge reaches the test environment (for example: merge to main deploys; or a tag), and its URL.
- **`<tasks>`**: where run folders and the handoff live.

## Steps

**1. Qualify.** Run `qualify` over the intake (or only the keys given). Then ask the **needs you** questions one at a time. With `--qualify-only`, stop here and report.

**2. Stop and ask.** Show the ready bugs in the order you would take them, smallest and clearest first. Take the first one on the user's OK; the next ones follow without asking unless something below says stop.

Then, per bug:

**3. Pick.** `ticket-pick`, then `tracker-move` to In progress.

**4. Confirm the cause.** Pass "the bug happens, caused by <file:line>" with the qualify evidence to `verify-claim`. **Fails** or **unclear**: drop the bug back to the board's waiting section with the reason, and take the next.

**5. Fix.** `delegate` an implementer in a fresh worktree from the base branch, test-first, committing at the end. Its brief carries the ticket text, the qualify evidence and fix hint, and the load limits.

**6. Review.** `delegate` a fresh reviewer over the new commits, running the guard tests, into `REVIEW-<KEY>.md`. Blocking findings go back to an implementer (step 5) with the report. Cap at three rounds; after that, stop and ask.

**7. Check locally.** Write `check-<KEY>.md` from the ticket's expected vs actual, then `ui-check` local. A fail goes back to step 5 with the report.

**8. Ship.** Under the charter:
1. Push and open the MR with the ticket in its description. The MR text goes out under the user's name: show it first, unless the charter grants it for this flow. Ticket to In Review, `tracker-move` to In review.
2. `watch` the pipeline for the head SHA until it ends.
3. **Stop and ask** to merge, naming the MR and the SHA, unless the charter grants merges for this flow. Merge pinned to that SHA.
4. Release as the config says, and `watch` it until the test environment has the change.

**9. Check on the test environment.** `ui-check` against the test environment URL with the same check file.

**10. Close.** Ticket to Done, `tracker-move` to Released with the version and date, remove the worktree and the local branch. One line per bug in the handoff.

**11. Report.** When the queue is empty, or the user stops it: through `handoff`, per bug its end state (released, waiting with the reason, needs you with the question, for a human), what is still open, and the questions.

## When a step fails

- **A unit ends `blocked`**: record why in the handoff, put the bug in the board's waiting or blocked section, take the next bug.
- **A unit ends `needs-you`**: ask at once if the user is there; otherwise park the bug with the question and take the next.
- **The pipeline fails**: read the failed job. A failure the change caused goes back to step 5; anything else is retried once, then parked with the job link.
- **The check fails on the test environment but passed locally**: don't reopen the code yet. Report both reports side by side and ask.

## Rules

- **One bug in work at a time per repo.** The next one starts after this one is released or parked.
- **The board follows every state change.** A move the tracker shows but the board doesn't is a bug in the run.
- **Nothing under the user's name without their OK**: comments, MR descriptions and ticket rewrites, unless the charter grants it.
- **Leave others' tickets alone**: no status, assignee or board moves on items someone else owns.
