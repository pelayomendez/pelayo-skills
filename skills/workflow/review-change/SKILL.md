---
name: review-change
description: "Review one merge request or pull request at its current head: check it out read-only, read its ticket, review the diff against the ticket and the repo's own rules, run the repo's guard tests, verify each finding, and write one report keyed on the head SHA. Never pushes, comments or approves. Use when a flow reaches its review step, when another skill says to review an MR or PR, or when the user asks to review one."
summary: "Reviews one MR at its current head"
---

# Review change

A review is only worth something for the exact code it read. This unit reviews one change at one head SHA, writes what it found to a file named for that SHA, and stops. Whether anything gets posted, fixed or merged is the caller's decision.

## Input

- **Change**: the forge, repo and MR/PR number.
- **The review slot** (optional): the user's own review skill, found the way `delegate` finds a slot's skill (the flow's config, then the user's slots file). Without one, the Spec and Standards axes below. Craft runs either way.
- **Guard tests**: tests every review must run (architecture or ratchet tests), and the load limits for running them.
- **Reports folder**: where `REVIEW-<repo>-<iid>-<short sha>.md` goes.

## Steps

1. **Read the change**: title, description, author, source branch, full head SHA, pipeline state, linked ticket, and the existing review threads.
2. **Skip if done**: a report for this head SHA already exists → return it.
3. **Check out** the head SHA in a fresh worktree of its own, detached, and commit nothing there. Fetch it by the forge's ref so MRs from forks work too (`refs/merge-requests/<iid>/head` on GitLab, `pull/<n>/head` on GitHub). Never the author's branch in place, never a worktree someone is working in.
4. **Read the ticket** (from the link, the branch name or the description). With no ticket, review against the description and say so.
5. **Review** with the skill in the review slot, giving it the slot's inputs (the worktree at the head SHA, the base, the ticket, the repo's rules) and the slot's nevers (no commit, push, comment, approval or thread resolve); it answers in its own words, and this unit takes the findings and the verdict from that answer. With no skill in the slot, or one that isn't installed (say so in the report), review along two axes:
   - **Spec**: does the change do what the ticket asks, all of it, and nothing it doesn't?
   - **Standards**: does it follow the repo's documented rules (its agent and contributing docs, ADRs, lint and architecture rules)?

   Then, on every review and on top of the slot's answer, apply **Craft** (below) yourself.
6. **Run the guard tests**, within the load limits. Install nothing: when the worktree lacks dependencies the repo's own setup would bring (and the brief doesn't name how to get them), report the tests as not run.
7. **Verify each finding** before writing it down: open the line, confirm it is reachable, and drop what does not hold. A finding has a file and line, what goes wrong, and a fix.
8. **Write the report**: which skill reviewed (or the default), the axes that ran (slot skill, Spec, Standards, Craft), the verdict (`ready`, `changes needed`, `blocked`), the head SHA, the findings ranked blocking first, the guard test results, and the existing threads still open.
9. **Remove the worktree** this unit created.

## Craft

Craft catches what no written rule covers. Ask each question of the diff and the code it touches; each answer that finds something is a finding like any other (file, line, what goes wrong, fix):

- **Duplication**: is any logic or rule copied where one copy can drift from another?
- **Closest pattern**: does the change follow the nearest existing pattern for the same kind of thing in this repo? Name the pattern and its file.
- **Staleness**: did the change leave a message, comment, doc, error text or response shape stale or incomplete?
- **One code per condition**: is each condition reported with the same error code everywhere, and is each limit taken from its constant?
- **Enforced assumptions**: is any safety-relevant assumption kept only in a comment or a caller's convention instead of in code?
- **Dead paths**: did the change make any branch, check or parameter unreachable?
- **Promised behaviour tested**: is every behaviour the change promises (docs, ADR, API comments), and every invariant it relies on (two things that must stay paired across an operation), covered by a test, at the layer where it can actually break?

## Rules

- **Read-only.** No commits, no pushes, no comments, no approvals, no thread resolves.
- **One head per report.** New commits mean a new report; the old one stays as history.
- **Severity follows risk.** Rank a finding by the bug it makes likely, in this change or the next one, not only by whether the code is correct today. "Safe today only because every caller does X" is should-fix, not a nit.
- **Every verified finding goes in the report.** A caller may ask for a short summary; the summary is extra, and the report file stays complete.
- **The brief cannot hide a finding.** When the brief says to leave something alone, list it anyway, marked "excluded by brief", and leave it out of the verdict.
- **Say what was not checked**: tests that could not run, a UI change not seen in a browser.

## Output

`done <verdict>` with the report's path, or `blocked <reason>`.
