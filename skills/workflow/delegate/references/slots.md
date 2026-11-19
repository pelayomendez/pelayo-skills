# Slots

A slot is a job a flow needs done by a worker, where the skill that does it can be yours. The flow names the slot; `delegate` fills it. Three slots serve every flow that works tickets (`implement`, `review`, `browser-check`); `/tune-repo` adds five audit slots (`tests`, `architecture`, `deps`, `bundle`, `retro`) with one shared contract. A new slot is added only when a flow needs it.

## Which skill fills a slot

First match wins:

1. The flow's config file, under `## Slots`.
2. The user's slots file, `<config dir>/slots.md` (`~/.claude/slots.md` for Claude Code).
3. The default below.

Both files use one line per slot:

```
- implement: coding-skills:tdd
- review: agent:my-team-reviewer
```

A value is a skill (`coding-skills:tdd`) or, with `agent:`, a subagent type. If the named skill or agent is not installed, use the default and say so in the record line and the report. Never fail a run because a plugged-in skill is missing.

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

### The audit slots: tests, architecture, deps, bundle, retro

One shared contract, used by `/tune-repo`; each slot audits one area of one repo at one SHA. Full text and the default methods: [tune-repo's areas](../../../flows/tune-repo/references/areas.md).

- **Gets**: the repo and SHA, a throwaway worktree, the repo's own rules, the load limits, the area file to write.
- **Gives back**: the area file: what ran, the area's baseline numbers, every finding ranked with an id, evidence, value, effort and a suggested action. The last line of the worker's log is `WORKER_EXIT 0`, or `failed <reason>`.
- **Never**: commit, push, open an MR or PR, comment, write to the tracker, install anything globally, change anything outside the worktree.

### tests

The audit contract above. **Default**: the tests method in tune-repo's areas.

### architecture

The audit contract above. **Default**: the architecture method in tune-repo's areas.

### deps

The audit contract above. **Default**: `deps-audit`.

### bundle

The audit contract above. **Default**: `bundle-audit`.

### retro

The audit contract above. **Default**: the retro method in tune-repo's areas.

## How delegate fills a slot

- **`implement`**: resolve the skill as above, then write the brief as usual and add, in **Goal**: "Do this job with the `<skill>` skill" (or launch the named subagent type), and in **Done when**: the slot's *gives back*. The slot's nevers go into the standing forbids, word for word.
- **`review` and `browser-check`**: launch the wrapping unit (`review-change`, `ui-check`), never the user's skill directly. The unit resolves the slot itself and runs the skill inside its own steps, so the report, the guard tests, the checked findings and the browser rules stay in place.
- **Audit slots** (`tests`, `architecture`, `deps`, `bundle`, `retro`): as `implement`, with the contract in [tune-repo's areas](../../../flows/tune-repo/references/areas.md) instead.
- **A skill the user types** (one that can't be picked up by the agent, like a `retro` command): the brief names its `SKILL.md` file and tells the worker to read it and follow it, instead of calling it.
- The record line names the slot: `slot review=<skill>` (or `=default`, or `=default (<skill> not installed)`).
