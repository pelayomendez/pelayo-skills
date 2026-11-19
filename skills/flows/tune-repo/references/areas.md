# The five areas

Each area is a slot: a job a worker does in its own throwaway worktree at one SHA, with your skill or the default below. They share one contract, so `/tune-repo` can put five answers into one report.

## The contract every area shares

- **Gets**: the repo and SHA, the throwaway worktree, the repo's own rules (its agent docs, coding standards, ADRs, boundary configs, ratchet tests, from the config's `## Tune` section or found in the repo), the load limits, the area file to write.
- **Gives back**: the area file with a header (what ran, which skill, tools fetched, what didn't run and why), the area's baseline numbers, and every finding ranked, each with an id, the evidence (file and line, numbers or command output), value, effort (S, M or L) and a suggested action. Last line of the worker's log `WORKER_EXIT 0`, or `failed <reason>`.
- **Never**: commit, push, open an MR or PR, comment, write to the tracker, install anything globally, change anything outside the worktree.

A skill in the slot answers in its own words; the worker turns the answer into the area file. A skill that ends by asking the user something (a grilling, a pick) stops before that question: the question waits for the morning, written into the area file as an open question.

## Defaults

### tests (`T`)

Every verdict answers one question: what bug would this test catch?

- Read the runner and CI config: what runs where, what is skipped, what never runs (excluded paths, `.skip`, `.only`, disabled jobs).
- Search for the usual smells: tests with no assertion, assertions that can't fail, snapshot-only tests of large trees, sleeps instead of waiting for a condition, mocks of the unit under test, tests that copy the implementation.
- Timing: the slowest files and tests (from the runner's own report, or CI test reports), and the share of suite time they take.
- Seams: tests at the wrong level (a unit test through the whole app, an end-to-end test for pure logic).
- Settle doubtful cases by breaking the production code in the worktree and seeing whether the test fails (a hand mutation, or the repo's mutation tool if it has one); revert each one.
- Baseline: test count, suite time, skipped tests.

### architecture (`A`)

- First the repo's **own** rules: its layer map, ADRs, boundary configs (dependency-cruiser, lint import rules, module boundaries) and ratchet tests. Run what exists; a rule that is configured but not wired into CI, or a ratchet ceiling that has stopped shrinking, is a finding.
- Then where the code fights its own design: weight by churn (the files changed most in the last 90 days, `git log --since=90.days --name-only`), and look there for shallow modules (an interface nearly as big as what it hides), one concept spread over many files, cycles, and imports that go against the layer direction.
- Each finding names the module, the rule or the design it breaks, and the smallest change that would deepen it. No rewrite plans.
- Baseline: boundary violations, cycles, ratchet ceilings.

### retro (`R`)

Reads the last 30 days of the agent's session logs for this repo (for Claude Code, `~/.claude/projects/<repo path with slashes as dashes>/`), read-only.

- Look for corrections ("no", "that's wrong", "I said"), interrupts, the same rule repeated across sessions, retry loops, and rejected permissions.
- For each pattern, name where the fix belongs, most mechanical first: an automated check (lint rule, test, CI job) for a fixed pattern; the repo's coding standards for a judgement call; the agent docs (CLAUDE.md, AGENTS.md) only for what neither can hold; a skill for reusable know-how.
- Each finding quotes the evidence: the session date and the user's own words, briefly.
- Baseline: sessions read, corrections found.

### deps (`D`) and bundle (`B`)

The units `deps-audit` and `bundle-audit`.
