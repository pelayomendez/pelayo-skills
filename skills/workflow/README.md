# Workflow

Units for running agent work: permissions, backlogs, workers, watches and handoffs. Each does one job and works alone; the flows in `skills/flows/` chain them.

## Model-invoked

- **[charter](./charter/SKILL.md)**: looks up and records what the agent may do alone, must ask first, or must never do, per scope, in your charter ledger.
- **[verify-claim](./verify-claim/SKILL.md)**: checks an agent's claim with a fresh subagent that sees only the claim and its evidence.
- **[snapshot-backlog](./snapshot-backlog/SKILL.md)**: reads a backlog scope into one local file (`tickets.json`) that the other backlog units work from. Read only.
- **[code-check](./code-check/SKILL.md)**: reads the code side of a set of tickets (merged and open MRs, releases and deploys, stale MRs, MRs with no ticket) into `code.json`. Read only.
- **[prune-backlog](./prune-backlog/SKILL.md)**: proposes which tickets can close, each with evidence written as a checkable claim (`prune.md`).
- **[order-backlog](./order-backlog/SKILL.md)**: ranks open tickets by WSJF inside the dependency graph, keeps bundles together, names the critical path, finds a home for untracked work and marks which rows are ready (`queue.md`).
- **[delegate](./delegate/SKILL.md)**: writes a self-sufficient worker brief (`brief.md`), picks the model, and launches the worker in its own worktree, recording its log and PID (`worker.log`, `worker.pid`, `workers.md`).
- **[watch](./watch/SKILL.md)**: watches external state for one exact revision (a pipeline, an MR, a deploy, a package version) against a recorded baseline, reports changes, and lists every armed watch (`watches.md`). Never starts work.
- **[handoff](./handoff/SKILL.md)**: writes the one size-capped file a supervising session resumes from (`handoff-<date>.md`): restart prompt, state and owners, the charter scope in force, watches to re-arm.
- **[qualify](./qualify/SKILL.md)**: researches each reported bug (code, logs, browser when needed) and labels it ready for an agent, or names the missing question. Never fixes.
- **[review-change](./review-change/SKILL.md)**: reviews one MR or PR at its head SHA, read-only, against its ticket and the repo's rules, and writes one report with verified findings.
- **[ticket-pick](./ticket-pick/SKILL.md)**: checks a ready ticket is still ready and free, then takes it into work: In Progress, assigned to you, with a sprint and points.
- **[ui-check](./ui-check/SKILL.md)**: checks a change in a controlled browser, locally or on a test environment, after making sure the port, the browser and the test project are free.
- **[tracker-move](./tracker-move/SKILL.md)**: moves one item between the sections of a status board kept in a ticket's description (an epic's Tracker), leaving the rest of the description untouched.
- **[check-flow](./check-flow/SKILL.md)**: checks one flow file before it runs: the units it lists exist and can be called, the steps use only those units, and every push, merge, post or delete has a stop or a charter check. Changes nothing.
- **[deps-audit](./deps-audit/SKILL.md)**: lists the dependencies one repo could drop, swap, dedupe or update, each with evidence. Tools only inside a throwaway worktree; changes nothing.
- **[bundle-audit](./bundle-audit/SKILL.md)**: builds one web app and measures what it ships, tracing each heavy piece to the import that brings it in. Changes nothing.
