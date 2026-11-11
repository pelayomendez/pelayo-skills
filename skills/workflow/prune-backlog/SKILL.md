---
name: prune-backlog
description: "Propose which tickets in a backlog snapshot can be closed, each with evidence (already done, duplicate, superseded, orphaned, unanswered), never by age alone. Proposes only. Use when a skill asks for prune proposals, or when the user asks which tickets can go, what is already done, or how to clean a backlog without closing important work."
---

# Prune a backlog

Closing everything older than N months cleans the list blindly: the important ticket that was only waiting goes with the rest. This skill proposes a ticket for closing **only with evidence against it**, and writes each proposal as a claim that can be checked.

## Input

A snapshot from the `snapshot-backlog` skill: `backlog-<scope>-<date>/tickets.json`. If there isn't one, run that skill first.

## Signals, strongest first

1. **Already done.** A merged MR or commit references the key, or the code already does what the ticket asks. Look for:
   - `git log --all --oneline --grep '<KEY>'` in each relevant repo
   - merged MRs or PRs that mention the key (`glab mr list --merged --search '<KEY>'`, `gh pr list --state merged --search '<KEY>'`)
   - a direct read of the code the ticket describes

   Compare the ask with the code the way a drift check would: is anything missing, is a model missing fields, is a value hardcoded where logic was asked for, was it built a different way? If some of it is done, propose **narrowing** the ticket to what is left instead of closing it.
2. **Duplicate.** A duplicate link, or another ticket asking for the same thing. Cite both.
3. **Superseded.** A newer ticket, an ADR or an approved design covers it.
4. **Orphaned.** Its parent epic is closed or cancelled.
5. **Unanswered.** A question to the reporter or owner has had no answer for months. Propose asking once more, or closing with that reason.
6. **No owner, no activity, no links, low priority.** The weakest signal. List these for the user to decide; never propose closing on this alone.

Age alone is not a signal.

## Output

Write `prune.md` next to the snapshot, one numbered row per proposal:

| id | ticket | signal | claim | evidence | would refute it | action |
|---|---|---|---|---|---|---|
| 1 | ABC-7 | already done | The CSV export ABC-7 asks for exists and is wired to the menu | commit `a1b2c3`, `src/export/csv.ts:40` | no export call from the menu, or a stub | close |

- **action** is `close`, `narrow to <what is left>`, `merge into <key>`, or `ask owner`.
- Any comment that would go with the change (a closing reason, a question to the owner) is written out in full, because it would be posted under the user's name.
- The claim, evidence and would-refute columns are what the `verify-claim` skill takes as input.

Nothing is applied here. Changing the tracker is for the flow or the user, after approval.
