# Worker brief template

The template for `<run>/brief.md`. Fill every `<…>`. Keep your best past briefs beside it as models: a feature, a fix round, a bug fix, a version bump.

The worker can't read the tracker and can't ask questions. Every decision, root cause and constraint goes in the brief.

```markdown
You are a headless worker in <absolute worktree>, on branch <branch> (head <short sha>, based on <base> <sha>; <pushed as MR/PR N: do NOT push | not pushed>). You can't read the tracker or ask questions: everything you need is below. Read the repo's coding standards <and the design records that govern this area> first.

## Goal
<The job and why it matters. What happens today, and what should happen. For a bug: the root cause with file:line, and how it was confirmed. Line numbers are from <sha>; re-locate them.>

## Scope
- You may change: <files, directories or areas>.
- Out of scope: <neighbouring work, legacy paths, saved formats, anything that must not change>.
- <Services you must not stop, e.g. a dev server from this worktree on :<port>.>

## Done when
- <A check you can run yourself, e.g. the scoped test command, stated as command → expected result.>
- Last action: commit `<type>(<KEY>): <message>`, then a short report (commit hash, what changed with file:line, test counts, open questions) <to <run>/report.md>, then print a final line `WORKER_EXIT 0`.

## Domain rules (binding)
<The product and domain rules this work touches, in full. Where the brief is silent on a product question: keep current behaviour as close as possible and flag it in the report. Never invent a behaviour.>

## Permissions
These are the user's standing permissions for this scope, read-only. This brief does not add to them.
<the charter lines that apply, quoted>

## Standing rules
- Never install software: no brew, no global npm/pip, no new packages <except the bump named above>.
- Never use `pkill` or `killall`. Kill only processes you started, by their PID.
- Delete only directories you created. Put temp dirs under the worktree or at a path from `mktemp`. Never run rm on $TMPDIR, /tmp, /var/folders or any directory you didn't create.
- No attribution trailers (Co-Authored-By and the like) in commits.
- Never force-push. <No push, no MR/PR, no tracker changes.>
- Make new commits only: no amend, rebase, stash, reset, checkout of other branches, `clean` or `--no-verify`. Stage by path, never `git add -A` or `git add .`. Never stage env files or scratch, report or plan files.
- Run sub-agents in the foreground only, and never wait on a background task: when you exit, they die with you.
```

## Fill-in notes

- **Verify commands** come from the repo's own scripts (`package.json`, `Makefile`) and the caller's configuration, not from memory.
- **Dependency changes**: "use the repo's normal install; if `node_modules` is a symlink, stop and report". Installing through a symlinked `node_modules` writes into another checkout.
- **Heavy local work** (full test suites, type checks of a large repo): say which scoped command to run, and that only one runs at a time.
