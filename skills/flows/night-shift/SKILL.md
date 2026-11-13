---
name: night-shift
description: "Run an unattended overnight loop: a decision round before you leave, then tickets through worker, checks, MR and merge, ending in a morning report."
disable-model-invocation: true
argument-hint: "[until HH:MM]"
---

# Night shift

`/night-shift` runs a ticket queue while you are away. Everything is decided before you leave (the **decision round**), everything that happens goes into the night's handoff, and the morning report sits at the top of it.

The session **decides and reports**. Workers and subagents do the heavy work; the session never commits and never runs a test suite inline. It is a flow: each step below is a unit that also works alone, and this file only sets their order, where the run stops, and what to do when a step fails.

## Units

- `charter`
- `order-backlog`
- `delegate`
- `verify-claim`
- `watch`
- `handoff`
- `reap-procs`

All state lives in `<tasks>`: the handoff (`handoff-<start date>.md`, one file for the whole night), the watch list and baselines (`watches.md`, `watch-*.json`), the ledger of reviewed MR heads (`reviewed-mrs.json`), and one run folder per ticket (`<tasks>/<KEY>/`, with the files `delegate` names plus `VERIFY-<KEY>.md`, `REVIEW-<KEY>.md`, `SMOKE-<KEY>.md` and `smoke/`).

## Configure for your workspace

Fill these in once, at the start of the decision round, and keep them in the handoff's "Files that matter" and "Rules in force". The steps refer to them by name.

- **`<workspace>`**: the root directory holding the repos.
- **`<tasks>`**: the state folder for this run (e.g. `<workspace>/.agent-tasks`).
- **Tracker transitions**: the ids or names for In Progress, In Review and Done, and how a ticket gets a sprint and points.
- **Repos**: the worktree the workers run in; the repos whose merges and open MRs you watch; the packages whose published versions you watch.
- **Dev server**: port, start command, and the env var that pins the test project.
- **Test project**: the one project the browser smoke may touch.
- **Gates**: the verify commands (type check, scoped tests, cycle check, lint) and the review skill used for the independent review.
- **Workers**: the implementer and reviewer sub-agents a worker brief names, and the model for each.
- **Domain rules**: the product and domain rules no worker may break. They go in "Rules in force" and into every brief.

## 1. Before the user leaves

1. **Read** the newest handoff and the memory index.
2. **Decision round.** Ask everything in one round, because once they leave you can't ask:
   - **Push and open MRs** tonight: yes or no, and for which repos. If no, finished tickets stay as local commits on their branch.
   - **Merge** tonight: yes or no, and for which repos. If yes, an MR merges only when CI is green on its head SHA, the independent review approves and the browser smoke passes. If no, stack commits and leave the MRs for the morning.
   - **Queue**: the ready rows of the newest `queue.md` from `order-backlog`, if there is one, plus extra tickets (follow-ups, bugs from today's smokes).
   - **Package bumps** allowed tonight, and whether a new release of a shared package may be picked up.
   - **Product calls** a queued ticket depends on. Asking now beats guessing later.
3. **Record the permissions** with `charter`, scoped to `night run <date>` with `until` a time the next morning (e.g. `09:00`): push and open MRs (which repos), merge (which repos), package bumps, and any provisional product calls you may take alone. Answers that aren't permissions (the queue, a settled product call) go in the handoff.
4. **Write the handoff** with `handoff`, named for tonight's date and kept for the whole run, even past midnight: the decisions under "Rules in force", the queue as one line (`A → B → C`), and `night shift starts` in the event log.
5. **Keep the machine awake** (macOS): `( caffeinate -ims -t 36000 & echo $! > <tasks>/caffeinate.pid )`. The display may still sleep.
6. **Preflight** with `reap-procs`. On **wait**, sort out the reason before arming anything.
7. **Dev server** runs from the active worktree with the test-project env var set. Check with `lsof -iTCP:<port> -sTCP:LISTEN` and that process's working directory; start it if needed, logging to `<tasks>/devserver.log`.
8. **Arm the watches** with `watch`, in `<tasks>`:
   - `backend-merges`: an hourly scheduled check on merges in the watched repos. It always reports, even with no merges, naming the ticket each merge belongs to and the queued tickets it unblocks.
   - `backend-mrs`: the open MRs in the watched repos, keyed on head SHA. Its baseline means "seen"; which heads were reviewed lives in `reviewed-mrs.json`.
   - `packages`: the published versions of the watched packages, from `npm view <pkg> version` run in a repo whose `.npmrc` resolves the scope.
9. **Update the handoff** with `handoff`, so "Watches to re-arm" lists what step 8 armed.
10. **Arm the loop**: `/loop` with no interval, so it paces itself, with the prompt from [references/loop-prompt.md](references/loop-prompt.md) and tonight's decisions filled in.

## 2. Each ticket

One ticket at a time per repo, in queue order. A ticket is done when it is merged (or ready to merge, if merging isn't authorized), the tracker matches, and the handoff has a line for every step.

1. **Confirm the cause.** For a bug, pass "the bug happens, caused by <file:line>" to `verify-claim`, with the browser, the network log or the dev environment's data as evidence. **Fails** (already fixed, or the cause lives in another team's service): drop the ticket and tell the user in the report.
2. **Tracker**: In Progress, assigned to the user, with a sprint and points.
3. **Launch** with `delegate`, run folder `<tasks>/<KEY>/`, starting from its brief template plus the ticket sections in [references/worker-brief.md](references/worker-brief.md). Wait on the PID as `delegate` describes.
4. **Gates**, each a read-only subagent through `delegate`, each writing a report file, in this order and never two test suites at once:
   - **Verify**: the configured gate commands, scoped with `--root <worktree>`, after the worker's own suite has finished, into `VERIFY-<KEY>.md`.
   - **Review**: the configured review skill over the new commits, into `REVIEW-<KEY>.md`. It reads code only.
   - **Smoke**: the browser (chrome-devtools), into `SMOKE-<KEY>.md` and `smoke/`. Test project only; it restores the project to its starting state and removes what it created; it never prints or extracts tokens; if another driver holds the tab, it stops and reports.
   Then pass the worker's claim ("<KEY> is fixed at <sha>") with the three reports to `verify-claim`.
5. **Fix round** on blocking findings: a new worker through `delegate` (new commits, `fix-brief.md`), then all three gates again: verify, review and smoke.
6. **Push and open the MR**, only under tonight's push grant; without it, log the branch as ready and take the next ticket. Fast-forward push only. Put the ticket list in the MR description. Tracker to In Review.
7. **CI** with `watch`, keyed on the full head SHA, until a terminal state.
8. **Merge** only under tonight's grant and with all three gates passed on that SHA: `glab mr merge <iid> --sha <full sha>` (or the host's equivalent).
9. **After the merge**: fast-forward the worktree (`git fetch origin && git merge --ff-only origin/main`), tracker to Done, log the MR, merge commit and tickets. Next ticket.

## 3. Every tick, besides the ticket

- **Watch reports.** Act on what `watch` reports; the watch itself never starts work.
- **Open MRs in watched repos.** Review each new head SHA in a read-only subagent with the review skill, into `<tasks>/backend-reviews/<repo>-<iid>.md`, then add that head to `reviewed-mrs.json`, only once the report exists. A review that failed stays unreviewed and is retried next tick. One line per MR in the handoff: its impact on our side, and any breaking change. Never post comments.
- **New package version.** Read its changelog, write the impact (breaking changes, what it unblocks, whether it needs a bump ticket), update the baseline.
- **Release and deploy.** On main, the latest release tag and whether its build and deploy jobs succeeded. Log which of tonight's merges are live.
- **Handoff.** One timestamped line per event, through `handoff`.

## 4. When a step fails

- **Root cause not confirmed, or not ours**: drop the ticket, report it. Evidence beats the ticket: one ticket was built before the smoke showed the backend already did the work (its DELETE calls returned 404); it was reverted and cancelled.
- **Worker exits without `WORKER_EXIT 0`**: read the log before trusting its commit. If the work isn't there, record what the log shows and leave the ticket for the morning.
- **Worker started by mistake**: stop it by PID at once, as `delegate` describes, and report it.
- **CI ends `failed` or `canceled`**: don't merge. Read the failed job's log; a failure the ticket caused gets a fix round, anything else (a flaky job, an infrastructure error) is retried once, then left for the morning with the job link.
- **A watch broke** (exited with an error, or its heartbeat went stale): re-arm it once from `watches.md`. If it breaks again, log that source as blind and name it in the morning report.
- **Preflight says wait** before a launch: don't launch. Work what needs no new process (watch reports, handoff), and check again on the next tick.
- **A blocking finding needs a product call** the decision round didn't cover: don't push; leave the branch and the finding in the handoff for the morning, and take the next ticket.
- **Smoke can't run** (VPN down, environment unreachable, browser not allowed or held by another session): don't merge and don't idle. Finish everything else (verify, review, fixes, push, MR with CI green, description noting "smoke pending") so it can smoke and merge the moment access returns, keep working the queue, and list every MR waiting on a smoke in the morning report. Never stop another session's Chrome to get the browser.
- **An MR blocks the queue** (unmerged, merge not authorized): stack the next ticket's commits on the same branch locally, but never push onto an MR under review. It must stay exactly as reviewed.
- **A product call nobody can make**: take the option closest to the user's earlier decisions, build it so it can be reversed, and log it under "Decisions taken on your behalf".

## 5. Rules for the whole run

Each comes from something that went wrong on a real run.

- **Comments** on the tracker or the code host: draft them in the handoff, post none tonight. Posting later is one item at a time, each after an explicit OK for its exact text.
- **Merging** needs tonight's grant in the charter and all three gates on the head SHA. Without the grant nothing merges: nobody is there to ask.
- **Never merge while the pipeline is pending.** Auto-merge once saw "no pipeline running" while the pipeline was still queued, and merged before CI. Wait for `success` on the head SHA.
- **Pushes are fast-forward only**, and commits are new commits: no amend, no rebase of pushed work, no stash, no `git add -A`.
- **The session doesn't commit.** If a mechanical revert is unavoidable, log it as the exception it is.
- **Load.** One worker per repo; never two full test suites at once; no worker while a smoke is running, and hold even small commits during a smoke, because an edit hot-reloads the dev server and spoils it.
- **Restart the dev server after any dependency change** (package bump, install) before a smoke. A server once kept serving the old bundle, and the first two smoke saves silently dropped a field into the test project.
- **The browser profile is shared across sessions.** If another session holds it, stack the next ticket and retry the smoke later, or use an isolated browser instance if one is configured.
- **Clean up a review worktree** only when the code host says its MR is merged or closed. A dead PID proves nothing.

## 6. Morning report

When the user is back, or the queue is empty, put `## Morning report` at the top of the handoff, under 150 words:

- **Merged**: MR, merge commit, tickets, and whether each is live.
- **Open**: MR or branch, and why (which gate, which decision).
- **Tickets created**: keys, one line each.
- **Product calls made on your behalf.**
- **Questions for you.**

## 7. Next-day plan

Then write a second, separate report, `<tasks>/NEXT-DAY-PLAN-<date>.md`, and give it to the user as its own message, because they forward it to other teams and plan the day from it:

- **Tracker check**: a subagent audits every ticket touched in the last 24 hours (status matches reality, assignee, sprint, points). It fixes only a missing assignee, sprint or points, reports the rest, and never comments.
- **Asks per team**: one bullet per thing another team must do to unblock our progress, with its ticket or MR and why it blocks.
- **Queue for today**: the next tickets in order, what each waits on, and which product questions come first.

Then stop the loop, `kill $(cat <tasks>/caffeinate.pid)`, and point the memory index at the new handoff.
