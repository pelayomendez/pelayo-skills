---
name: mr-review
description: "Go through the open merge requests of your repos, yours and your teammates', review each at its current head, and stop for you on every one: yours to land (fix, pipeline, merge, check on the test environment, close), theirs to comment on. You validate each MR yourself; nothing is merged or posted without your word."
disable-model-invocation: true
argument-hint: "<config file> [!iid ...] [--mine | --theirs]"
---

# MR review

`/mr-review <config>` takes the open MRs of the configured repos and brings each one to the point where you decide: reviewed at its current head, with the evidence in front of you. You validate every MR yourself. The flow never merges, approves or posts on its own, even where the charter would allow it.

It is a flow: every step is a unit that also works on its own, and this file only sets the order and where it stops for you.

## Units

Steps, in order:

- `watch`
- `review-change`
- `verify-claim`
- `delegate`
- `ui-check`

Throughout:

- `charter`
- `tracker-move`
- `handoff`

Reports go in `<tasks>/reviews/`, one per MR head: `REVIEW-<repo>-<iid>-<short sha>.md`. The ledger `<tasks>/reviews/reviewed.json` maps each MR to the last head reviewed, so a second pass skips what has not changed.

## Config

The same file as `/support`, plus a `## Review` section:

- **Repos**: the repos whose open MRs to go through.
- **Mine**: the user's username on the forge. Their MRs are "yours"; everyone else's are "theirs".
- **Skip**: drafts, MRs labelled as not ready, or authors to leave out.
- **Review skill**, **guard tests** and **load limits** for `review-change`.
- **Comments**: the style for review comments (for example: one or two plain sentences, optional ones prefixed `Nit:`).

## Steps

**1. List.** With `watch`, read the open MRs of the configured repos with their head SHA, author, pipeline and linked ticket. Keep the ones whose head is not in the ledger (or only the ones named in the argument). Split them into yours and theirs.

**2. Review.** For each, `review-change` at its head. Then pass its verdict, with the report, to `verify-claim` ("<repo>!<iid> at <sha> is <verdict>"), so the verdict you see has been checked by a fresh agent. Record the head in the ledger only once the report exists.

**3. Stop: you validate, one MR at a time.** Show one card per MR: title, ticket, author, head SHA, pipeline, verdict, the blocking findings in a line each, and the report's path. Yours first, then theirs, oldest first. Wait for your call on each card before the next.

**4. Your MRs**, on your call:
- **Fix**: `delegate` an implementer on the MR's own branch with the report, then back to step 2 for the new head.
- **Merge**: only on your word for this MR and this head, with the pipeline `success` for the same SHA. Pinned to that SHA.
- After the merge: release as the config says, `watch` until the test environment has it, `ui-check` there, then the ticket to Done and `tracker-move` to Released (under the charter). Show the result.
- **Leave**: note it in the handoff and move on.

**5. Their MRs**, on your call:
- **Comment**: draft the comments in the configured style, one per finding you choose. They go out under your name: show the exact text, post only what you approve.
- **Leave**: nothing is posted. The report stays for you.
- Never push to their branch, approve, resolve their threads or merge.

**6. Report.** Through `handoff`: per MR, the head reviewed, the verdict, and what you decided. Then what is still open.

## When a step fails

- **The checkout or the guard tests fail to run**: the report says so, and the card shows it. Don't present an unrun test as passing.
- **The MR moved while you were deciding** (new head): say so on the card and review the new head before acting.
- **`verify-claim` fails or is unclear on a verdict**: show both, and say the verdict is unconfirmed.

## Rules

- **You validate every MR.** No merge, comment, approval or ticket move happens without your call on that MR, whatever the charter says for other flows.
- **One head per decision.** A call you made applies to the head you saw. A new head needs a new look.
- **Read-only on others' work.** Their branches, threads and tickets stay as they are.
- **Run with `/loop`** for a recurring pass; each pass only reviews new heads.
