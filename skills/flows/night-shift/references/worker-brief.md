# Night-shift ticket brief

Start from the `delegate` unit's brief template, which carries the goal, scope, done-when, domain rules, permissions and standing rules. A night-shift ticket fills it in like this.

## Goal

```markdown
## Ticket <KEY>: <one-line problem>
<What happens today, and why. Root cause with file:line, confirmed by verify-claim against the browser / network log / DEV data. Line numbers are from <sha>; re-locate them.>

## Fix
- <Each change: behaviour first, then where. Say what must NOT change.>
- Out of scope: <neighbouring tickets, legacy paths, old behaviour, saved formats>.
```

## Test seams

```markdown
## Test seams (test nowhere else)
- <A pure function, or a loader/service seam with mocked fetch. One bullet per case, as input → expected. No rendered tests.>
```

## Done when

```markdown
- Use the repo's Node version (`nvm use`, or the repo's own tool).
- Run the configured implementer, then the configured reviewer, as sub-agents in the foreground. Tests use mocks only.
- Before each commit:
  - <type check>
  - <scoped tests, with `--root "$PWD"` (with vitest, never `--pool=threads`)>
  - <cycle check>
  - <lint on the changed files>
  Kill any test run YOU started, by its PID.
- A dev server from this worktree runs on :<port>; don't stop it.
- No push, no MR, no tracker.
- Last action: commit `<type>(<KEY>): <message>`, a short report (hash, <the ticket-specific points with file:line>, test counts, reviewer findings, open questions), then a final line `WORKER_EXIT 0`.
```

## Notes

- **Verify commands and scoped dirs** come from the repo's `package.json` and the flow's configuration.
- **Package bumps**: the repo's normal install, and `npm run build` once after it. If `node_modules` is a symlink, stop and report.
- **Fix rounds** use the same brief with the findings as the goal, saved as `fix-brief.md`.
