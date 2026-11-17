# Slots

A slot is a job a flow needs done by a worker, where the skill that does it can be yours. The flow names the slot; `delegate` fills it. Three slots exist, and a new one is added only when a flow needs it.

## Which skill fills a slot

First match wins:

1. The flow's config file, under `## Slots` (for example `review: my-team-review`).
2. The user's slots file, `<config dir>/slots.md` (`~/.claude/slots.md` for Claude Code), same format.
3. The default below.

A value is a skill (`coding-skills:tdd`) or a subagent type (`agent:my-implementer`). If the named skill or agent is not installed, use the default and say so in the record line and the report. Never fail a run because a plugged-in skill is missing.

## The contracts

The skill in a slot answers in its own words. The caller turns the answer into the slot's output, so a plugged-in skill never has to know these formats. What it must provide is the facts below, and it must keep to the nevers whatever its own instructions say.

### implement

- **Gets**: the brief (goal, scope, done when, domain rules, permissions, standing forbids), the worktree, the ticket text.
- **Gives back**: commits on the worktree's branch, and a report: what changed, the tests it added and ran with counts, open questions. Last line `WORKER_EXIT 0`, or `blocked <reason>`.
- **Never**: push, open an MR or PR, merge, comment, write to the tracker, install software. The standing forbids in the brief apply in full.
- **Default**: a test-first fix: a failing test that shows the bug or the missing behaviour, the smallest change that makes it pass, the scoped tests green.

### review

- **Gets**: the change at one head commit, checked out read-only, the base it is compared to, the ticket text, the repo's rules.
- **Gives back**: findings, each with file and line, what goes wrong, and a fix, ranked blocking first; a verdict: `ready`, `changes needed` or `blocked`. Findings are checked by the caller (`review-change` opens each line) before they count.
- **Never**: commit, push, comment, approve, resolve threads.
- **Default**: `review-change`'s own method: spec (does it do what the ticket asks, all of it, nothing more) and standards (the repo's documented rules).

### browser-check

- **Gets**: the check file (steps and expected results), the URL, the test project and what may be done there, the controlled browser tools.
- **Gives back**: per step, what was seen and pass or fail, with evidence files.
- **Never**: use the user's own browser, touch anything outside the test project, print tokens, leave pages open.
- **Default**: `ui-check`'s own run.

## How delegate fills a slot

- Resolve the skill as above, then write the brief as usual and add, in **Goal**: "Do this job with the `<skill>` skill" (or launch the named subagent type), and in **Done when**: the slot's *gives back*.
- The slot's nevers go into the standing forbids, word for word.
- The record line names the slot: `slot review=<skill>` (or `=default`, or `=default (<skill> not installed)`).
