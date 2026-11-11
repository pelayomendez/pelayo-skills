---
name: backlog
description: "Tidy and order an existing tracker backlog: prune with evidence instead of by age, map what blocks what, and propose a ranked queue with one reason per ticket. Proposes only; nothing moves without your OK."
disable-model-invocation: true
argument-hint: "<scope: project, epic, label or query> [--prune-only | --order-only]"
---

# Backlog

`/backlog <scope>` — for a backlog that already exists: which tickets can go, what blocks what, and in which order the rest should be done. The output is a proposal and a ranked queue that a human, or a session like `night-shift` or `ambient-companion`, can work from top to bottom.

Closing everything older than N months cleans the list blindly: it kills the important ticket that was only waiting, and leaves the rest unordered. This skill closes only what has evidence against it, and orders what remains.

## Rules

- **Read freely, write never without an OK.** Every change to the tracker (close, link, re-rank, transition, comment) is ask first; check the user's charter with the `charter` skill if they keep one, and leave out of the proposal any action it marks never. The user approves by id list ("close 2, 5; link 7"); any comment that goes with a change (a closing reason, a question to the owner) is shown in full in the proposal, because it is posted under their name. Each approved change is one visible command. No bulk transitions, no query-wide updates.
- **Show the inputs, not only the result.** Every rank shows what it was made of and where each input came from: *tracker* or *asked*.
- **Never invent value.** Business value and real deadlines come from the user. Everything else is read from the tracker and the code.
- **Inferred is not fact.** Dependencies you infer are marked as such and change the order only once the user confirms them.

## 1. Fetch

Scope comes from the argument: a project, an epic, a label, a saved query; open tickets only. Raw incoming reports that were never triaged are a different job: Matt Pocock's `triage` skill, if installed. Read with the tracker's CLI ([references/trackers.md](references/trackers.md)), every page, and keep per ticket: key, title, type, status, assignee, created, last updated, parent or epic, links (with direction), labels, estimate or points, due date or release, the description, and the comments (the last few are enough; signal 5 below depends on them). Check one known link's direction by hand before trusting the rest: some CLIs report it inverted.

Say how many tickets are in scope before going on. Above ~150, propose splitting by epic or component.

## 2. Prune with evidence

Propose a ticket for closing only with a signal, strongest first:

1. **Already done.** A merged MR or commit references the key, or the code already does what it asks (check the repo, cite the file or commit).
2. **Duplicate.** A duplicate link, or another ticket asking for the same thing: cite both.
3. **Superseded.** A newer ticket, an ADR or a redesign covers it.
4. **Orphaned.** Its parent epic is closed or cancelled.
5. **Waiting on someone who never answered.** A question to the reporter or owner left unanswered for months: propose asking once more, or closing with that reason.
6. **No owner, no activity, no links, low priority.** The weakest signal: list these for the user to decide, never propose closing them on this alone.

Age alone is not a signal. Each proposal: ticket, signal, evidence (a link, a commit, a key), proposed action (close, merge into, ask owner).

## 3. Map dependencies

- **Explicit**: the tracker's blocks / is blocked by links. Hierarchy is not a dependency: children block their parent epic, never the other way round, so leave epics out of the order and rank their children.
- **Inferred**, marked as such: a ticket that names another key; a frontend ticket naming an endpoint or field another ticket adds; two tickets touching the same module; the order an epic's description gives.

Build the graph. Tickets in a cycle, or blocked by a ticket that was cancelled or no longer exists, stay out of the order until the user settles them; list them under open questions.

## 4. Score

Order by **WSJF** inside the dependency graph ([references/scoring.md](references/scoring.md)): (value + time criticality + risk reduction or what it unblocks) ÷ size, each on a relative scale (1, 2, 3, 5, 8, 13, 20).

- From the tracker: **size** (points or estimate; else a rough read of the description, marked *guessed*), **time criticality** (due date, release, sprint), **unblocks** (how many open tickets wait on it, directly or through others).
- From the user, in **one** short round and only for the top ~20 candidates: **value**, and any deadline the tracker doesn't show. Offer the tracker-only ranking first so they correct it rather than fill a form.

A ticket never ranks above something it depends on. Ties go to the one that unblocks more.

## 5. Report

Write it to `backlog-<scope>-<YYYY-MM-DD>.md` in the workspace (or where the user asks), and show the summary:

1. **Prune proposals**: id · ticket · signal · evidence · proposed action.
2. **Ordered queue**: rank · ticket · value · urgency · unblocks · size (each *tracker*, *asked* or *guessed*) · blocked by · one-line reason · ready (no open blockers, clear enough to start).
3. **Inferred dependencies** to confirm. Once the user confirms or rejects them, re-run the ordering (step 4) before anything is applied or handed on.
4. **Open questions**: cycles, missing estimates on top tickets, anything only the user can settle.

## 6. Apply what was approved

Only the ids the user named, one command each, then re-read the ticket to confirm the change. Note in the report what was applied and what was left.

The ordered queue is the plan; **ready** marks where to start. A session that works through tickets (`night-shift`, `ambient-companion`, or a person) takes the top ready row, and a row becomes ready as its blockers close, so after finishing one it takes the next row that is now unblocked, not only the rows that were ready at report time. Re-run `/backlog` when the queue runs low or the plan changes, because scores go stale.
