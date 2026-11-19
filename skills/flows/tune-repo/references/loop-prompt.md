# Tune-repo loop prompt

Arm the loop with `/loop` and no interval, so it paces itself. Fill in the `<…>`. The prompt must stand alone: a tick may run after a context compaction.

```text
Tune run <repo> at <short sha>, <date> (user away). Handoff: <tasks>/tune/handoff-<date>.md. Run folder: <run>. Read the handoff first every tick, and follow the tune-repo flow from step 4.

Areas: <tests, architecture, deps, bundle, retro>. Slots: <area=skill, …>. Load limits: <…>. Charter: <tool fetching in worktrees granted | not granted>.

Each tick:
1. Collect: for each area worker whose PID is gone, copy TUNE-<area>.md from its worktree root to <run>/<area>.md and remove the worktree. Missing file or `failed`: read the log; retry once with a fix that stays inside a worktree, else mark the area failed.
2. Launch: the next waiting area, if the load limits allow and reap-procs says go. Never two builds or two test suites at once.
3. Log each launch, exit and retry in the handoff.
4. When every area is collected or failed: rank, verify-claim on the top 5 and the high-value findings, write the report, the morning report, then stop the loop and the keep-awake.

Hard rules:
- Nothing is committed, pushed, posted or written to the tracker.
- Kill only processes this run started, by PID. Delete only worktrees this run created.
- Ask nothing; the user grills the report in the morning.
```
