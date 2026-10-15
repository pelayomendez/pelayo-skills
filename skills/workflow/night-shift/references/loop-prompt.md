# Night-shift loop prompt

Arm the loop with `/loop` and no interval, so it paces itself. Fill in the `<…>` from tonight's decision round. The prompt must stand alone: a tick might run after a context compaction.

```text
Night shift <date> (user away until ~<time>). Handoff: <tasks>/ORCHESTRATOR-HANDOFF-<date>.md, section "Night run". Read it first every tick. Follow the night-shift skill.

Tonight's decisions:
- Merge: <AUTHORIZED for <repos> when CI is green on the head SHA + the independent review approves + the browser smoke passes | NOT authorized: stack commits, leave the MRs ready>.
- Queue: <A → B → C …>. Extras: <…>. Package bumps allowed: <…>.
- Product calls pending: <…>. Otherwise take the option closest to the user's prior decisions and flag it.

Each tick:
1. Pipeline. Is a worker or subagent running? Check its pid, and whether its wait command has returned.
   - Worker exited: launch verify, then review, then smoke, in that order, never two suites at once.
   - Gates done: fix worker, or push → MR → CI watch on the full SHA → merge (only if authorized) → fast-forward the worktree → tracker Done.
   - Nothing running: take the next ticket in the queue. Confirm its root cause first, then tracker In Progress, then the brief, then launch.
   Never start a worker while a smoke is running.
2. Backend open MRs (the watched repos): review each new head SHA not in backend-mr-review.json, in a read-only subagent. Write the report to <tasks>/backend-reviews/<repo>-<iid>.md. Never post.
3. Packages: npm view the packages in package-versions.json. On a new version: impact summary, then update the baseline.
4. Main branch: the latest release, and whether build + dev-deploy succeeded. Which merges are on DEV?
5. Log one timestamped line per event in the handoff (time from `date`).

Hard rules:
- No tracker/GitLab comments; keep drafts in the handoff.
- Never force-push. The orchestrator never commits.
- Delete only dirs you created.
- The smoke uses only the test project <FORCED_PROJECT_ID>, cleans up, never prints tokens, and stops if another driver is using the tab.
- If a worker was started by mistake, kill it at once and report it.
- Drop work when the evidence says the bug isn't ours.

Pacing: while a worker, CI run or smoke is in flight, wake at about its expected finish (5–15 min). When everything is idle and the queue is empty, write the morning report at the top of the handoff and stop the loop.
```
