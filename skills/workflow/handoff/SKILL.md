---
name: handoff
description: "Write or update the one handoff file a supervising session resumes from: restart prompt, state table with owners, the charter scope in force, watches to re-arm, decisions taken for the user, open questions, files that matter. Size-capped; older detail goes to an archive. Use before a session that oversees agents or long-running work ends, clears or runs out of context, when another skill says to write the handoff, or when the user asks to hand off, wrap up or prepare a restart."
---

# Handoff

A session that supervises other agents (workers, watches, an overnight run) holds state nobody else has: who owns what, what is being watched, what the user allowed. When the session ends that state is gone, unless it is in a file. The **handoff** is that file: the only thing a fresh session can trust.

Unlike a session-end note for code work (the `handoff` in [mattpocock/skills](https://github.com/mattpocock/skills)), it carries owners, watches and permission scope, so a supervising session can resume.

## Where it lives

- `<dir>/handoff-<YYYY-MM-DD>.md`, where the caller chooses `<dir>` (a flow's state folder, or `.handoff/` by default). One file per date, so the newest handoff is also the last in sorted order.
- **A run keeps its start date.** A run that crosses midnight (an overnight shift) writes to the file named for the day it started, until it ends.
- Older detail goes to `<dir>/archive.md`, which is never named `handoff-*`, so tools looking for the newest handoff don't pick it up.
- Take every date and time from `date`. Never estimate one: one night a log's clock ran an hour ahead because the times were guessed.

## Write or update

1. **The file for this date or run exists**: update it in place. **Otherwise**: start a new file from the newest one, carrying forward what is still open.
2. Fill every section of [references/template.md](references/template.md), in that order. An empty section says `none`, so the reader knows it wasn't forgotten.
3. **Watches**: copy the rows of the `watch` unit's `watches.md`, with the exact command that re-arms each. Harness crons and monitors die with the session; the next one re-arms from this list.
4. **Charter**: point at the scope, don't copy the grants. Name the scope (`night run <date>`, a repo, an epic) and list only today's changes, each with the user's sentence. The ledger stays the source; the `charter` unit reads it.
5. **Cap it at about 150 lines.** Move to `archive.md` (appending, newest at the top): event-log lines from earlier days, finished items, and decisions that no longer bind. Keep the archive out of the restart prompt.

## Keep it honest

- **State is evidence, not hope.** Each row says how you know: a report file, a pipeline id for a SHA, a PID. A dead worker is not a finished one, and a quiet MR is not an abandoned one.
- **Decisions taken on the user's behalf** each get a line: what you chose, why it is closest to what they decided before, and how to reverse it.
- **Write it before the context fills, not after.** Quality drops as a session grows; a handoff written by a tired session carries the tiredness forward.

## Done when

A fresh session given only the restart prompt can take the next step without asking anything.
