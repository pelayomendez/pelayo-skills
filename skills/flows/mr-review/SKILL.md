---
name: mr-review
description: "Go through the open merge requests of your repos, yours and your teammates', review each at its current head, and stop for you on every one: yours to land (fix, pipeline, merge, check on the test environment, close), theirs to comment on. You validate each MR yourself; nothing is pushed, merged, moved or posted without your word."
summary: "Reviews open MRs; you decide on each"
disable-model-invocation: true
argument-hint: "<config file> [!iid ...] [--mine | --theirs]"
---

# MR review

`/mr-review <config>` takes the open MRs of the configured repos and brings each one to the point where you decide: reviewed at its current head, with the evidence in front of you. You validate every MR yourself.

It is a flow: every step is a unit that also works on its own, and this file only sets the order and where it stops for you.

## Units

Steps, in order:

- `review-change`
- `verify-claim`
- `delegate`
- `ui-check`

Throughout:

- `charter`
- `watch`
- `tracker-move`
- `handoff`

Reports go in `<tasks>/reviews/`, one per MR head: `REVIEW-<repo>-<iid>-<short sha>.md`. The ledger `<tasks>/reviews/ledger.json` records, per MR, the last head reviewed and your decision on it (`fix`, `merged`, `commented`, `left`, or none yet).

## Config

The same file as `/support`, plus a `## Review` section:

- **Repos**: the repos whose open MRs to go through, each with its own app, check and release settings (as in the support config) when you land MRs there.
- **Mine**: the user's username on the forge. Their MRs are "yours"; everyone else's are "theirs".
- **Skip**: drafts, MRs labelled as not ready, or authors to leave out.
- **Review skill**, **guard tests** and **load limits** for `review-change`.
- **Comments**: the style for review comments (for example: one or two plain sentences, optional ones prefixed `Nit:`).

## Steps

**1. List.** Read the open MRs of the configured repos from the forge (a plain read, e.g. `glab mr list` / `gh pr list` with JSON): head SHA, author, pipeline, linked ticket. Keep the ones named in the argument, or else every MR whose head differs from the ledger's, plus every MR whose head has no decision yet. Split them into yours and theirs.

**2. Review.** For each new head, `review-change`. Then pass to `verify-claim` each blocking finding ("<file:line> breaks <what>"), and a `ready` verdict as a claim of its own, each with what would refute it (the line is unreachable, a test covers it, the ticket asks for it). Record the head in the ledger, with no decision yet.

**3. Stop: you validate, one MR at a time.** One card per MR: title, ticket, author, head SHA, pipeline, verdict and whether it held up, the blocking findings in a line each, the report's path. Yours first, then theirs, oldest first. Wait for your call on each card before the next, and record it in the ledger.

**4. Your MRs**, on your call:
- **Fix**: `delegate` an implementer on the MR's branch with the report. When it ends, show the new commits and the diff. **Push only on your word**, fast-forward only. The new head goes back to step 2.
- **Merge**: only on your word for this MR and this head, with the pipeline `success` for the same SHA. Pinned to that SHA. Your merge call covers what follows only if you say so ("merge and close"); otherwise ask again before each of: the release step when it is more than the merge (a tag, a deploy), the ticket to Done, and `tracker-move` to Released.
- After the merge: `watch` until the test environment has the change, write `check-<KEY>.md` from the ticket's expected vs actual, `ui-check` there, and show the result before closing.
- **Leave**: note it and move on.

**5. Their MRs**, on your call:
- **Comment**: draft the comments in the configured style, one per finding you choose. They go out under your name: show the exact text, post only what you approve.
- **Leave**: nothing is posted. The report stays for you.
- Never push to their branch, approve, resolve their threads or merge.

**6. Report.** Through `handoff`: per MR, the head reviewed, the verdict, and your decision. Then what is still open.

## When a step fails

- **The checkout or the guard tests fail to run**: the report says so, and the card shows it. Don't present an unrun test as passing.
- **The MR moved while you were deciding** (new head): say so on the card and review the new head before acting.
- **`verify-claim` fails or is unclear on a verdict or a finding**: show both, and say it is unconfirmed.

## Rules

- **You validate every MR.** No push, merge, comment, approval, ticket or board move happens without your call on that MR. Charter grants from other flows don't apply here; charter nevers still bind.
- **One head per decision.** A call you made applies to the head you saw. A new head needs a new look.
- **Read-only on others' work.** Their branches, threads and tickets stay as they are.
- **Recurring passes**: with `/loop`, use `watch` on the repos' open MRs and let a pass stop after step 2 when you are away; the cards wait for you in the handoff.
