# Workflow

Units for running agent work (permissions, tickets, checks), plus the two long-running sessions that drive other agents.

## User-invoked

- **[ambient-companion](./ambient-companion/SKILL.md)**: a day-long companion session for one body of work. It watches the event streams (repos, change requests, pipelines, tracker), moves each item through workers and independent review, and brings you only the decisions.

## Model-invoked

- **[charter](./charter/SKILL.md)**: looks up and records what the agent may do alone, must ask first, or must never do, per scope, in your charter ledger.
- **[verify-claim](./verify-claim/SKILL.md)**: checks an agent's claim with a fresh subagent that sees only the claim and its evidence.
- **[snapshot-backlog](./snapshot-backlog/SKILL.md)**: reads a backlog scope into one local file (`tickets.json`) that the other backlog units work from. Read only.
- **[prune-backlog](./prune-backlog/SKILL.md)**: proposes which tickets can close, each with evidence written as a checkable claim (`prune.md`).
- **[order-backlog](./order-backlog/SKILL.md)**: ranks open tickets by WSJF inside the dependency graph and marks which rows are ready (`queue.md`).
- **[night-shift](./night-shift/SKILL.md)**: an unattended run while you're away. A decision round up front, then a loop that takes tickets through worker, verify, review, smoke, MR and merge, ending in a morning report.
