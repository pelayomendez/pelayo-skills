---
name: order-backlog
description: "Order the open tickets of a backlog snapshot into a ranked queue: map what blocks what, score by WSJF inside the dependency graph, mark which rows are ready, one reason per ticket. Proposes only. Use when a skill asks for a queue, or when the user asks what to do next, in what order, or what blocks what."
---

# Order a backlog

Turns a snapshot into a **queue**: a ranked list where no ticket comes before one it depends on, and each row says why it sits there.

## Input

- A snapshot from the `snapshot-backlog` skill: `backlog-<scope>-<date>/tickets.json`. If there isn't one, run that skill first.
- Optionally, keys to leave out (tickets already approved for closing), and inferred dependencies the user has confirmed or rejected.

## 1. Map dependencies

- **Explicit**: the tracker's blocks and blocked-by links.
- **Hierarchy is not a dependency.** Children block their parent epic, never the other way round. Leave epics out of the queue and rank their children.
- **Inferred**, always marked as such: a ticket that names another key; a frontend ticket that needs an endpoint or field another ticket adds; two tickets touching the same module; the order an epic or an approved design gives. An inferred dependency changes the order only once the user confirms it.
- Tickets in a cycle, or blocked by a ticket that was cancelled or no longer exists, stay out of the queue until the user settles them.

## 2. Score

WSJF, Weighted Shortest Job First ([references/scoring.md](references/scoring.md)):

```
WSJF = (value + time criticality + what it unblocks) ÷ size
```

Each input uses the relative scale 1, 2, 3, 5, 8, 13, 20.

| Input | From |
|---|---|
| size | points or estimate; otherwise a rough read of the description, marked *guessed* |
| time criticality | due date, release, sprint; otherwise ask |
| what it unblocks | how many open tickets wait on it, directly or through others |
| value | **the user**, never invented |

Offer a ranking built from tracker data first, then ask for value and missing deadlines in **one** short round, for the top 20 or so only. People correct a ranking more easily than they fill in a form.

Sort so that no ticket comes before one it depends on: at each step take the highest WSJF among the tickets whose blockers are already done or ranked. Ties go to the ticket that unblocks more. A difference like 4.3 against 4.1 is a tie; say so.

## Output

Write `queue.md` next to the snapshot:

1. **Queue**: rank · ticket · value · urgency · unblocks · size (each marked *tracker*, *asked* or *guessed*) · blocked by · reason (one line) · ready (no open blockers, clear enough to start).
2. **Inferred dependencies to confirm.** Once the user answers, run this skill again before the queue is used.
3. **Open questions**: cycles, missing estimates on top tickets, anything only the user can settle.

Whoever works the queue (a person, `night-shift`, `ambient-companion`) takes the top **ready** row. A row becomes ready as its blockers close, so after finishing one, take the next row that is now unblocked, not only the rows that were ready when the queue was written. Scores go stale: run it again when the queue runs low or the plan changes.
