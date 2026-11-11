# Worker brief skeleton

This is the template for `<tasks>/<KEY>/prompt.md`. Keep your best past briefs next to it as models: a feature, a fix round, a bug stopgap, a package bump.

The worker can't read the tracker, and it can't ask questions. Every decision, root cause and constraint must be in the brief.

```markdown
You are a headless worker on ticket <KEY> in <absolute worktree> on branch <branch> (head <short sha> on top of main <sha>; <pushed as MR !N — do NOT push | not pushed>). Make NEW commits only; never amend. Read the repo's coding standards and <the ADRs that govern this area> first. A dev server from this worktree runs on :<port>; don't stop it. You can't read the tracker; everything is below.

## Hard rules (user, <date>)
<The binding product and domain rules this ticket touches, e.g. the data source of truth; reuse existing component X, no new UI.>

## Ticket: <one-line problem>
<What happens today, and why. Root cause with file:line, confirmed in the browser / network / DEV data. Line numbers are from <sha>; re-locate.>

## Fix
- <Each change: behaviour first, then where. Say what must NOT change.>
- Out of scope: <neighbouring tickets, legacy paths, v1 behaviour, saved format>.

## Test seams (test nowhere else)
- <Pure function or loader/service seam, with mocked fetch; one bullet per case, stated as input → expected. No rendered tests.>

- Commit: `<type>(<KEY>): <message>`

## Rules
- The repo's Node version (`source ~/.nvm/nvm.sh && nvm use`). No new packages<, except the bump named above>.
- Run sub-agents in the FOREGROUND only: the configured implementer, then the configured reviewer. Never git stash. Tests use mocks only.
- Put any temp or sandbox dir that you or a sub-agent creates under the worktree, or at a path you made with mktemp. NEVER run rm on $TMPDIR, /tmp, /var/folders, or any directory you didn't create.
- Verify before each commit:
  - `npx tsc --noEmit`
  - `node ./node_modules/vitest/vitest.mjs run --root "$PWD" <scoped dirs>` (never `--pool=threads`)
  - `npm run check:cycles`
  - eslint on the changed files
  Kill any vitest YOU started.
- Git: stage by path. Never stage `.env.local`, plan/scratch dirs or REVIEW-*/SMOKE-* files. Never use `git add -A`/`git add .`, stash, checkout, restore, reset, clean, `--no-verify` or `--amend`. No push, no MR, no tracker.
IMPORTANT: never wait on a background task or background sub-agent. LAST action: the commit plus a short report (hash, <the ticket-specific points with file:line>, test counts, reviewer findings, open questions), then print a final line `WORKER_EXIT 0`.
```

Fill-in notes:
- **Scoped dirs and verify commands:** take them from the repo's `package.json` and the workspace configuration.
- **Package bumps:** "use the repo's normal install; if `node_modules` is a symlink, stop and report." Add `npm run build` once after the bump.
- **Product questions** the worker hits: "keep current behaviour as close as possible, flag it in the report". The worker never invents a behaviour.
