---
name: night-shift
description: "Unattended orchestrator run while the user is away: a decision round up front, then a self-paced loop that takes tickets through worker, verify, review, smoke, MR and merge, plus backend, package and deploy watches, ending in a morning report. Use for \"night shift\", \"/night-shift\", \"run overnight\", \"keep working while I'm away\"."
---

# Night shift

The user hands the orchestrator a queue and leaves. Everything is decided before they go (the **decision round**), everything that happens goes in the day's **handoff** (`<tasks>/ORCHESTRATOR-HANDOFF-<YYYY-MM-DD>.md`), and the morning report sits at the top of it.

The orchestrator **decides and reports**; subagents and headless workers do the heavy work. The orchestrator never commits (see Guardrails) and never runs a test suite inline.

## Configure for your workspace

Fill these in once, at the start of the decision round (or keep them in the handoff or your memory). The rest of the skill refers to them by name.

- **`<workspace>`**: root directory holding the repos. Paths below are relative to it.
- **`<tasks>`**: scratch dir for handoffs, briefs, logs and ledgers (e.g. `<workspace>/.claude/tasks`). Per-ticket files live in `<tasks>/<KEY>/`.
- **Tracker transitions**: the ids or names for In Progress, In Review and Done, plus how tickets get a sprint and points.
- **Repos**: the frontend worktree the workers run in; the backend repos to watch for MRs; the packages whose published versions you watch.
- **Dev server**: port, command, and the env var that pins the test project.
- **Test project**: the one project id the browser smoke may touch.
- **Gates**: the verify commands (type check, scoped tests, cycle check, lint) and the review skill used for the independent review.
- **Workers**: which implementer and reviewer sub-agents the worker brief tells the headless worker to run.

## 1. Start-up

Read the newest handoff and the memory index first. Then:

1. **Decision round.** Ask everything in one question call, because once they leave you can't ask:
   - **Merge authorization for tonight.** Yes or no, and for which repos. If yes, an MR merges only when CI is green, the independent review approves and the browser smoke passes. If no, stack commits and leave MRs for the morning.
   - **Queue.** Give the order and ask for extra tickets (follow-ups, bugs from today's smokes).
   - **Package bumps** allowed tonight, and whether a new release of a shared UI package may be picked up.
   - Any open product call a queued ticket depends on. Better to ask now than to guess later.
2. **Record tonight's permissions** with the `charter` skill, scoped to `night run <date>` with `until` a time the next morning (e.g. `09:00`): merge authorization (which repos), package bumps, and any provisional product calls you may take alone. Answers that aren't permissions (the queue, a product call they settled) go in the handoff.
3. **Record the decisions** in the handoff under `## Night run <date> → <date+1> (user decisions ~HH:MM)`. Put the queue there as one line (`A → B → C`). Take timestamps from `date`; don't estimate them (one night the log's clock ran an hour ahead).
4. **Keep the machine awake** (macOS): `( caffeinate -ims -t 36000 & echo $! > <tasks>/caffeinate.pid )`. The display may still sleep.
5. **Backend watch cron.** Crons are session-only, so re-create it every night: an hourly cron running `<tasks>/backend-merge-watch.sh`. Prompt rules: always report, even with no merges. For each merge, look up the ticket key and name the frontend tickets it unblocks. For deployer merges, give the wizard impact. Never start a worker from the watch.
6. **Dev server** must run from the active worktree, with the test-project env var set. Check with `lsof -iTCP:<port> -sTCP:LISTEN` and that process's `cwd`. Start it with the launch pattern (§2), logging to `<tasks>/devserver.log`.
7. **Baselines.** Write `<tasks>/package-versions.json` with the current published versions of the watched packages, from `npm view <pkg> version`, run from a repo whose `.npmrc` resolves the scope. Also write `<tasks>/backend-mr-review.json` (`{"<repo>!<iid>": "<head sha>"}`) for the backend MRs already reviewed.
8. **Arm the loop.** Run `/loop` with no interval, so it paces itself, and give it the full prompt from [references/loop-prompt.md](references/loop-prompt.md) with tonight's decisions filled in. Log `night shift starts` in the handoff.

## 2. Per-ticket pipeline

Take one ticket at a time per project, in queue order. The whole ticket is done only when it is merged (or left ready to merge, if merging isn't authorized), the tracker matches, and the handoff has a line for every step below.

1. **Confirm the root cause first.** Before writing a brief for a bug, confirm it in the browser, the network log or DEV data with a subagent. Name the cause with file:line. If the evidence says the bug is already fixed, or lives in the backend, drop the ticket and tell the user.
2. **Tracker.** Move the ticket to In Progress and assign it to the user. It needs a sprint and story points.
3. **Brief.** Write `<tasks>/<KEY>/prompt.md` from [references/worker-brief.md](references/worker-brief.md). The worker can't read the tracker, so everything it needs goes in the brief.
4. **Launch.** Use exactly this pattern; `nohup` fails in this setup. The brief goes in on **stdin**:
   ```bash
   T=<tasks>/<KEY>
   cd <worktree> && ( claude -p --permission-mode acceptEdits < $T/prompt.md > $T/worker.log 2>&1 & echo $! > $T/worker.pid )
   ```
   Never splice the brief into a command string (`sh -c "claude -p \"$(cat …)\""`). That once re-parsed the brief as shell: every `` `backticked` `` path and command in it was *executed* (tsc, vitest, `npm ci`, `git add …`) and stripped from the prompt, so the worker ran blind. Check a fresh worker with `ps -o command= -p <pid>`; it should show no prompt text.
   Fix rounds use `fix-prompt.md` / `fix.log` / `fix.pid`.
5. **Wait** with a background Bash (`run_in_background`) that returns when the worker dies: `while kill -0 $(cat <pid>) 2>/dev/null; do sleep 30; done; tail -60 <log>`. The worker's last line should be `WORKER_EXIT 0`. If it's missing, read the log before you trust the commit.
6. **Gate with three subagents.** Each writes a report file, and all three are read-only on git.
   - **Verify:** the configured gate commands (type check, scoped tests with `--root <worktree>`, cycle check, lint). It runs only after the worker's own suite has finished.
   - **Independent review:** the configured review skill over the new commits, written to `REVIEW-<KEY>.md`. It reads code only.
   - **Browser smoke** (chrome-devtools), written to `SMOKE-<KEY>.md` plus a `smoke/` folder for screenshots. It uses the test project only. It restores the scene to its starting state and cleans up anything it created. It never prints or extracts tokens. If another driver is using the tab, it stops and reports.
7. **Fix rounds.** Blocking findings go to a fix worker as NEW commits, then verify and re-review again. Hold even small commits while a smoke is running, because a worker's edit hot-reloads the dev server and spoils the smoke.
8. **Push and open the MR.** Push fast-forward only. Update the MR description with the ticket list. Move the tracker to In Review.
9. **CI watch** keyed on the full head SHA (`glab api "projects/<p>/pipelines?sha=<sha>"`). Wait for a terminal state: `success`, `failed`, `canceled` or `skipped`. A running pipeline is not a result.
10. **Merge** only if tonight's authorization covers it and all three gates passed on that SHA: `glab mr merge <iid> --sha <full sha> -R <gitlab_path>`. You may set auto-merge instead.
11. **After the merge:** fast-forward the worktree (`git fetch origin && git merge --ff-only origin/main`), move the tracker to Done, and log the MR, the merge commit and the tickets. Then start the next ticket.

**Load discipline.** Run one worker per project and never two full test suites at once. Don't start a worker while a smoke is running. Never run `npm ci` through a symlinked `node_modules`.

**When an MR blocks the queue** (unmerged and not authorized): stack the next ticket's commits on the same branch, but don't push onto an MR under review. It must stay exactly as reviewed.

## 3. Every tick, besides the pipeline

- **Backend open-MR review.** Cover the open MRs in the watched backend repos. Review each one that is new, or whose head SHA isn't in `backend-mr-review.json`, in a read-only subagent using the review skill. Write the report to `<tasks>/backend-reviews/<repo>-<iid>.md`, then update the ledger. **Never post comments.** The handoff gets one line per MR: its frontend impact, and any breaking change.
- **Package publish watch.** Compare `npm view <pkg> version` with `package-versions.json`. On a new version, read its CHANGELOG, write an impact summary (breaking changes, what it unblocks, whether it needs a bump ticket), then update the baseline.
- **Release and DEV deploy.** On main, check the latest release tag and whether its pipeline's build and dev-deploy jobs succeeded. Log which of tonight's merges are live on DEV.
- **Hourly backend watch** results go into the handoff even when nothing merged, together with the ticket keys it unblocks.

## 4. Guardrails

Each rule comes from something that went wrong on a real run.

- **Tracker and GitLab comments.** Draft each one, show the exact text, and post it only after an explicit OK for that item. Tonight, save drafts in the handoff. "Explain and post" still means one item at a time.
- **Merging** happens only under tonight's grant in the charter and all three gates. Without that grant nothing merges tonight: nobody is there to ask, so leave the MRs ready for the morning.
- **Pushes are fast-forward only.** Commits are new commits: no amend, no rebase of pushed work, no stash, no `git add -A`.
- **Product calls.** When the user isn't there to decide, take the option closest to their prior decisions. Log it under "Decisions taken on your behalf", and build it so it can be reversed.
- **Kill a mistaken worker fast.** A misread "ready" once started a bump worker; it was stopped within a minute. Check `git status` shows no changes, keep the prompt for later, and report it.
- **Evidence beats the ticket.** One ticket was built, and only then did the smoke show that the backend already did the work (the DELETE calls returned 404). It was reverted and cancelled. Confirm the bug before building (§2.1), and drop the work when the evidence says so.
- **Restart the dev server after any dependency change** (package bump, `npm install`) before a smoke. A server once kept serving the pre-bump bundle; the first two smoke saves silently dropped a field and wrote that to the test project.
- **When the smoke can't run** (VPN down, DEV unreachable, browser not allowed or held by another session): don't merge and don't wait idle. Get everything else done (verify, review, fixes, push, MR open with CI green, description noting "smoke pending") so the MR is ready to smoke and merge the moment access returns. Keep working the queue meanwhile, and list every MR waiting on a smoke in the morning report.
- **The browser profile is shared across Claude sessions.** Another session once held it and a smoke couldn't attach. Never kill another session's Chrome; stack the next ticket and retry the smoke later (or use an isolated MCP instance if configured).
- **Never merge while the MR pipeline is pending.** `glab mr merge --auto-merge` once saw "no pipeline running" (the pipeline was still queued) and merged at once, before CI. Wait for `success` on the head SHA, then merge.
- **Watchers compare against terminal states for a specific SHA.** A watcher keyed on "latest pipeline" once reported the old SHA's result.
- **Domain rules.** Put the workspace's non-negotiable product and domain rules in the handoff's decision section and repeat them in every brief. Without them, workers invent behaviour.
- **Kill only your own processes, by PID.** A reviewer once cleaned up with a broad `pkill vitest`, which would also kill another session's test run. Briefs say: kill only the vitest you started, by its PID.
- **Deletes stay inside your own dirs.** A reviewer subagent once ran `rm` over `$TMPDIR`. Block that with a hook if you can, and repeat the rule in every brief: delete only directories you created.
- **The orchestrator doesn't commit.** If a mechanical revert is unavoidable, log it as the exception it is.
- **Cleanup.** Clean a review worktree only when GitLab says its MR is merged or closed. A dead PID proves nothing.

## 5. Morning report

When the user is back, or the queue is empty, write `## Morning report` at the top of the handoff. Keep it under 150 words:

- **Merged:** MR, merge commit, tickets, and whether each is on DEV.
- **Open:** MR or branch, and why it's still open (which gate, which decision).
- **Tickets created:** keys, with one line each.
- **Product calls made on your behalf.**
- **Questions for you.**

## 6. Next-day plan (a separate daily report)

Every morning, after the morning report, write a second, separate report, `<tasks>/NEXT-DAY-PLAN-<date>.md`, and give it to the user as its own message:

- **Tracker check:** a subagent audits every ticket touched in the last 24 h (status matches reality, assignee, sprint, points); it fixes only missing assignee/sprint/points and reports anything else. Never comments.
- **Backend asks, per service:** one bullet per thing the backend must do to unblock frontend progress, each with its ticket key or MR and why it blocks.
- **Frontend queue for today:** the next tickets in order, what each is blocked on, and which product questions must be answered first.

This is a daily report on its own (not part of the morning report), because the user forwards it to the backend team and plans the day from it.

Then stop the loop and kill caffeinate (`kill $(cat <tasks>/caffeinate.pid)`). Update the handoff memory to point at the new file.
