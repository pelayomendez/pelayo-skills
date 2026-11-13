# Night-shift loop prompt

Arm the loop with `/loop` and no interval, so it paces itself. Fill in the `<…>` from tonight's decision round. The prompt must stand alone: a tick may run after a context compaction.

```text
Night shift <date> (user away until ~<time>). Handoff: <tasks>/handoff-<start date>.md (keep this file all night, even past midnight). Read it first every tick, and follow the night-shift flow.

Tonight's decisions:
- Push + open MRs: <AUTHORIZED for <repos> | NOT authorized: commits stay local>.
- Merge: <AUTHORIZED for <repos> when CI is green on the head SHA + the independent review approves + the browser smoke passes | NOT authorized: stack commits, leave the MRs ready>.
- Queue: <A → B → C …>. Extras: <…>. Package bumps allowed: <…>.
- Product calls pending: <…>. Otherwise take the option closest to the user's prior decisions and log it.

Each tick:
1. Ticket. Is a worker or subagent running? Check its pid, and whether its wait has returned.
   - Worker exited: verify, then review, then smoke, in that order, never two suites at once.
   - Gates done: verify-claim on the worker's claim, then a fix worker, or push → MR (only if authorized) → watch CI on the full SHA → merge (only if authorized) → fast-forward the worktree → tracker Done.
   - Nothing running: the next ticket in the queue. Confirm its cause with verify-claim, tracker In Progress, then delegate.
   Never start a worker while a smoke is running.
2. Watches: read <tasks>/watches.md and act on what changed. Re-arm any watch that died. A watch never starts work by itself.
3. Open MRs in the watched repos: review each head SHA not in reviewed-mrs.json, in a read-only subagent, into <tasks>/backend-reviews/<repo>-<iid>.md; add it to reviewed-mrs.json only once that report exists. Never post.
4. Packages: on a new version, an impact summary, then update the baseline.
5. Main branch: the latest release, and whether build + deploy succeeded. Which merges are live?
6. Log one timestamped line per event in the handoff (time from `date`).

Hard rules:
- No tracker or code-host comments; drafts go in the handoff.
- Never force-push. This session never commits.
- Delete only dirs you created. Kill only processes you started, by PID.
- The smoke uses only the test project <TEST_PROJECT_ID>, cleans up, never prints tokens, and stops if another driver holds the tab.
- If a worker was started by mistake, stop it at once and report it.
- Drop the work when the evidence says the bug isn't ours.

Pacing: while a worker, CI run or smoke is in flight, wake at about its expected finish (5–15 min), always within the hour. When everything is idle and the queue is empty, write the morning report at the top of the handoff and stop the loop.
```
