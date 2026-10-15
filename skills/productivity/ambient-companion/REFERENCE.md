# Ambient companion — reference

Read before arming watches or spawning a worker, and whenever something in the run feels expensive or fragile.

## Trigger ladder

Cheapest first. Use the lowest rung that works for each source.

1. **Script loop, no model.** For anything mechanical: new commits on a branch, MR state, a package version. It writes a heartbeat and a state file. Run it as a background command that exits when it finds a change: the exit is what wakes the session. [`scripts/watch.sh`](scripts/watch.sh) does exactly this for any command whose output you want to watch. In Claude Code: a background Bash command, or a desktop scheduled task.
2. **Event wait.** A background process that returns when something reaches a terminal state: a worker exits, the pipeline for a given SHA finishes. The main wake signal for in-flight work. In Claude Code: Monitor, or a background command.
3. **Self-paced loop.** A judgement pass for unattended runs, with a long fallback wake inside the prompt-cache lifetime (under an hour). The tick prompt is self-contained and re-reads the handoff. In Claude Code: `/loop` without an interval.
4. **Scheduled prompt.** Only for a low-frequency check that needs interpretation. If the scheduler dies with the session, note when it expires.
5. **The human asking "what's next".** A legitimate trigger. Design the report for it.

An idle session still re-sends its whole context on every wake. Every model tick on a mechanical question is paid for in full.

## Delegation

A worker is a separate agent with its own context: in Claude Code, the Agent tool with an isolated worktree, or a headless `claude -p` in its own worktree with the brief on stdin.

- Workers get a **self-sufficient brief file**: they cannot see the tracker or this conversation. Goal and why, today → expected, scope and out of scope, a runnable definition of done, when to stop and report.
- One writer per unit of work, in an isolated checkout. Reviewers are read-only, get a fresh context with the diff and the brief, and are at least as capable as the writer.
- Workers signal completion explicitly (an exit status or a sentinel line) and are watched by PID, not by asking them.
- Every change passes independent gates (verify, review, real-environment check), each leaving a report file. One fix round, then the human.
- Pass briefs as files, never spliced into a shell command line.
- Keep heavy local work serial: one worker per repo, one full test run at a time.

## Durable state

- **Handoff file**: the state table, open items, rules in force and the event log. See [HANDOFF.md](HANDOFF.md). It is the only thing a fresh session can trust.
- **Memory**: an index, plus one note per rule with the incident behind it and how to apply it. A rule that supersedes another says so.
- **Ledgers**: things already reviewed or baselined, keyed by revision, so a restart does not redo them.

## Failure modes

- **Watching "latest"** instead of the revision you care about: a green result from someone else's commit.
- **Trusting the claim**: acting on what a ticket, a handoff or a worker says without checking the evidence. Check the worker process, the pipeline for that exact revision, and the tracker's actual state. A dead worker is not a finished one, and a quiet MR is not an abandoned one. Confirm a bug's root cause before briefing a worker on it.
- **Shared local resources**: ports, browser profiles, CPU. Use only what the charter gives you, and keep heavy runs serial.
- **Silent watchers**: session-scoped schedulers and monitors that vanish on restart. Re-arm deliberately at the start of every session.
- **Model in the polling loop**: a weekend of hourly ticks can cost more than the work they watched.
- **Context rot**: quality drops as the session grows. Hand off before the window fills, not after.
- **Notification fatigue**: the human starts approving everything. Batch, and ask only what only they can answer.
- **Broad access**: a companion that reads untrusted text (tickets, MR comments, logs), holds credentials and can post combines the three ingredients of prompt-injection risk. Keep posting behind _ask first_, enforced by permissions or hooks rather than by the prompt.
- **Secrets in the conversation**: a token pasted into the chat stays in the transcript. Point at where it lives instead.

## Background

The pattern has no single name yet. It sits where three ideas meet:

- **Ambient agents**: agents that react to an event stream rather than a chat, with the human notified, asked or reviewing ([Harrison Chase, LangChain, 2025](https://www.langchain.com/blog/introducing-ambient-agents)).
- **Conductor to orchestrator**: the engineer's job moves from steering one agent to overseeing several ([Addy Osmani, 2026](https://addyosmani.com/blog/future-agentic-coding/)).
- **The lethal trifecta**: private data, untrusted content and the ability to communicate externally, together, make prompt injection exploitable ([Simon Willison, 2025](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)). A companion has all three by design, which is why posting stays behind _ask first_.
