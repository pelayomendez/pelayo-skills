---
name: delegate
description: "Hand a piece of work to a separate worker agent safely: write a self-sufficient brief to a file, pick the model, launch the worker headless in its own worktree (or as a subagent), and record its log and PID. Use when a task should run in another agent's context, when another skill says to spawn or delegate a worker, or when the user asks to hand something to a worker, a subagent or a background agent."
---

# Delegate

A worker is a separate agent with its own context. It can't see this conversation, the tracker or the user, and it can't ask. What it knows is what the brief says. This unit writes that brief, launches the worker so it can't hurt anything outside its job, and records where to find it.

It stops at the launch. Whether the worker did what it says is a claim, and checking claims is the `verify-claim` unit's job.

## Input

- **The job**: what to do and why, and what done looks like.
- **Where**: the repo, and the branch or base revision to start from.
- **A run folder** `<run>` for this worker's files (e.g. `<tasks>/ABC-123/`). The caller picks it; the file names inside are fixed.

## 1. Check before launching

- **Several workers at once?** Run the `reap-procs` skill in preflight mode first, and launch only on **go**. On **wait**, report its reason instead of launching.
- **One writer per unit of work.** If a worker already writes in this repo, queue the job; don't start a second writer beside it.
- **Permissions.** Run the `charter` skill for the scope the worker will act in. Its lines go into the brief as they stand. The worker reads them; it never writes to the charter, and the brief is not a grant.

## 2. Write the brief

Write `<run>/brief.md` from [references/brief.md](references/brief.md). It has six parts, and none is optional:

1. **Goal**: the job, why it matters, and what happens today against what should happen.
2. **Scope**: the worktree path, the files or areas it may change, and what is out of scope. This is its write boundary.
3. **Done when**: a check it can run itself, and the last thing it does (commit, report file, final line).
4. **Domain rules**: the product and domain rules that bind this work, copied in full. Without them a worker invents behaviour.
5. **Permissions**: only the charter lines that fit the worker's own job, quoted. Never pass on the session's grants (merge, post, release): the worker doesn't get them by being launched.
6. **Standing forbids**, always, word for word from the template: no software installs, and no install through a symlinked `node_modules`; no `pkill` or `killall`; kill only processes it started, by PID; delete only directories it created; no attribution trailers; no force-push; no push, MR/PR, merge, comments or tracker writes. A caller may lift one of the last only explicitly, naming it in the brief.

Everything the worker needs goes in the file. A root cause belongs there with its file:line, not "see the ticket".

## 3. Choose the model

Pick the cheapest model that can do the job well:

- **Mechanical** (a version bump, a rename, collecting data): a light model.
- **Implementation**: a strong model.
- **Review**: at least as capable as the worker whose output it reviews, in a fresh context.

Say which you chose in the record, so a bad result can be traced to it.

## 4. Launch

**Headless worker in its own worktree**, for work that writes code. The brief goes in on stdin, from the file:

```bash
R=<run>
cd "<worktree>" && ( claude -p --permission-mode acceptEdits --model <model> < "$R/brief.md" > "$R/worker.log" 2>&1 & echo $! > "$R/worker.pid" )
```

- Never splice the brief into a command string (`sh -c "claude -p \"$(cat brief.md)\""`). The shell re-parses it: once, every backticked path and command in a brief was *executed* (type check, tests, `npm ci`, `git add`) and stripped from the prompt, so the worker ran blind.
- Check the launch: `ps -o command= -p $(cat "$R/worker.pid")` shows the process and no prompt text.
- Detaching wrappers such as `nohup` misbehave under some harnesses. The subshell with `&` above is enough; confirm the PID is alive.
- Other harnesses take the same shape: the brief file on stdin, the log to `worker.log`, the PID to `worker.pid`.

**Subagent**, for read-only or short work (a review, a check, a smoke test): the harness's subagent tool with an isolated worktree if it writes. Pass the brief file's content, and have it write its report to `<run>/<CHECK>-<KEY>.md` (`VERIFY-ABC-123.md`, `REVIEW-ABC-123.md`), so it never overwrites the worker's `report.md`.

## 5. Record

Append one line to `<run>/workers.md`, with the time from `date`:

```
<HH:MM> · <job> · <model> · <worktree> · pid <pid> · log <run>/worker.log · claim lands in <where>
```

`<where>` is what the worker leaves when it finishes: the commit on its branch, `<run>/report.md`, and the final line `WORKER_EXIT 0` in the log.

## Waiting and stopping

- **Wait by PID, not by asking.** A background command that returns when the worker dies: `while kill -0 $(cat "$R/worker.pid") 2>/dev/null; do sleep 30; done; tail -60 "$R/worker.log"`. No `WORKER_EXIT 0` at the end means read the log before trusting anything it committed.
- **A worker started by mistake is stopped at once**, by its PID. Check `git status` in its worktree shows nothing changed, keep the brief for later, and report it. A misread "ready" once started a bump worker; it was stopped within a minute.
- **Fix rounds** are new workers with their own files: `fix-brief.md`, `fix.log`, `fix.pid`. They make new commits on top; nothing is amended.

## Output

The run folder, the record line, and where the claim will land. Hand that claim to `verify-claim` before presenting it as done.
