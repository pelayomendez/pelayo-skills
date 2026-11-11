---
name: backlog
description: "Tidy and order an existing tracker backlog: prune with checked evidence instead of by age, map what blocks what, and propose a ranked queue with one reason per ticket. Nothing moves without your OK."
disable-model-invocation: true
argument-hint: "<scope: project, epic, label or query> [--prune-only | --order-only]"
---

# Backlog

`/backlog <scope>` tells you which tickets can go, what blocks what, and the order the rest should be done in. It is a flow: every step is a unit that also works on its own, and the flow only decides the order and where it stops for you.

## Units

- `snapshot-backlog`
- `prune-backlog`
- `verify-claim`
- `order-backlog`
- `charter`

All of them write into one run folder, `backlog-<scope-slug>-<YYYY-MM-DD>/`, so a run can be resumed after a `/clear` or picked up by another session.

## Flow

1. **Snapshot.** Run `snapshot-backlog` on the scope.
2. **Prune.** Run `prune-backlog`, which writes `prune.md`.
3. **Check the proposals.** Pass every proposal to `verify-claim` as claim, evidence and would-refute-it. Then:
   - **holds**: keep it
   - **partial**: narrow it to the part that held
   - **fails** or **unclear**: move it to open questions
   - **unchecked** (no fresh subagent available): keep it, marked unchecked, so the user knows nobody else looked

   Then check each remaining action with the `charter` skill and drop anything it marks never. Write the verdicts into `prune.md`.
4. **Stop and ask.** Show the checked proposals and wait for the user to approve by id ("close 2, 5; narrow 7"). Approving nothing is a valid answer.
5. **Apply** only the approved ids, one visible command per change (below), then re-read the ticket to confirm it. No bulk transitions, no query-wide updates. Note in `prune.md` what was applied and what was left.
6. **Order.** Run `order-backlog` on what is still open, excluding the tickets just closed. It writes `queue.md`, with its questions for the user at the end.
7. **Stop and ask** those questions in one round: value, missing deadlines, the inferred dependencies. Then run `order-backlog` again with the answers.
8. **Report.** Write `report.md` with three parts: what was closed or narrowed, the top ready rows of the queue, and the open questions. Show its summary.

`--prune-only` runs steps 1–5 and reports what was applied and what is still open. `--order-only` skips steps 2–5.

## Tracker writes

Used only in step 5, and only for approved ids:

| Action | Jira (`acli jira workitem …`) | GitLab (`glab issue …`) | GitHub (`gh issue …`) |
|---|---|---|---|
| close | `transition --key K --status Done` | `close N` | `close N --reason completed` (or `"not planned"`) |
| narrow | `edit --key K --description …` | `update N --description …` | `edit N --body …` |
| merge into | `link create --type Duplicate`, then close | `close N` with a note naming the other | `close N --reason duplicate` |
| comment | `comment create --key K --body …` | `note N -m …` | `comment N --body …` |

Check `--help` before the first write, and match the link direction recorded in the snapshot, because some CLIs invert `--in` and `--out`. A comment goes out exactly as the user approved it in step 4: it is posted under their name.
