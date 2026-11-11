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

All of them write into one folder, `backlog-<scope>-<YYYY-MM-DD>/`, so a run can be resumed after a `/clear` or picked up by another session.

## Flow

1. **Snapshot.** Run `snapshot-backlog` on the scope. Report the ticket count. Above about 150, offer to split by epic or component before going on.
2. **Prune** (skip with `--order-only`). Run `prune-backlog`, which writes `prune.md`.
3. **Check the proposals.** Pass every proposal to `verify-claim` as claim, evidence and would-refute-it. Then:
   - **holds**: keep it
   - **partial**: narrow it
   - **fails** or **unclear**: move it to open questions

   Write the verdict into `prune.md`.
4. **Stop and ask.** Show the checked proposals and wait for the user to approve by id ("close 2, 5; narrow 7"). Approving nothing is a valid answer.
5. **Apply** only the approved ids:
   - check each action with the `charter` skill, and leave out anything it marks never
   - one visible command per change, then re-read the ticket to confirm it
   - no bulk transitions, no query-wide updates

   Note in `prune.md` what was applied and what was left. Stop here with `--prune-only`.
6. **Order.** Run `order-backlog` on what is still open, excluding the tickets just closed. It writes `queue.md`.
7. **Stop and ask** for value, missing deadlines and the inferred dependencies, in one round. If any dependency answer changes the graph, run `order-backlog` again.
8. **Report.** Write `report.md`: what was closed, the top ready rows of the queue, and the open questions. Show its summary.

## Tracker writes

Used only in step 5, and only for approved ids:

- Jira: `acli jira workitem transition`, `acli jira workitem link create`, `acli jira workitem comment create`
- GitLab: `glab issue close`, `glab issue note`
- GitHub: `gh issue close --reason "not planned" --comment …`

A comment goes out exactly as the user approved it in step 4. It is posted under their name.
