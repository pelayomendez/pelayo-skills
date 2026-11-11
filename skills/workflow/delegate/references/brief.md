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
- Last action: commit `<type>(<KEY>): <message>`, then a short report (commit hash, what changed with file:line, test counts, open questions) to <run>/report.md, then print a final line `WORKER_EXIT 0`.

## Domain rules (binding)
<The product and domain rules this work touches, in full. Where the brief is silent on a product question: keep current behaviour as close as possible and flag it in the report. Never invent a behaviour.>

## Permissions
These are the user's standing permissions that fit this job, read-only. This brief does not add to them.
<only the charter lines for what this worker does (e.g. commit on a feature branch), quoted; never the session's own grants such as merge or post>

## Standing rules
- Never install software: no brew, no global npm/pip, no new packages <except the bump named above>. Never run `npm ci` or `npm install` through a symlinked `node_modules`: stop and report.
- Never use `pkill` or `killall`. Kill only processes you started, by their PID.
- Delete only directories you created. Put temp dirs under the worktree or at a path from `mktemp`. Never run rm on $TMPDIR, /tmp, /var/folders or any directory you didn't create.
- No attribution trailers (Co-Authored-By and the like) in commits.
- Never force-push. No push, no MR/PR, no merge, no comments, no tracker writes<, except: the exception the caller grants explicitly, named here>.
- Make new commits only: no amend, rebase, stash, reset, restore, checkout, `clean` or `--no-verify`. Stage by path, never `git add -A` or `git add .`. Never stage env files or scratch, report or plan files.
- Run sub-agents in the foreground only, and never wait on a background task: when you exit, they die with you.
```

## Fill-in notes

- **Verify commands** come from the repo's own scripts (`package.json`, `Makefile`) and the caller's configuration, not from memory.
- **Dependency changes**: the repo's normal install. The symlink rule is a standing forbid because installing through a symlinked `node_modules` writes into another checkout.
- **Lifting a standing forbid** (e.g. a worker that opens its own MR) is the caller's explicit decision, backed by a charter line, and named in the brief. Silence never lifts one.
- **Heavy local work** (full test suites, type checks of a large repo): say which scoped command to run, and that only one runs at a time.
