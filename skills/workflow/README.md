# Workflow

Long-running sessions that drive other agents.

## User-invoked

- **[backlog](./backlog/SKILL.md)** — Tidy an existing tracker backlog: prune with evidence, map dependencies, and propose a ranked queue with one reason per ticket, ready for a person or a session like night-shift to work from the top.

- **[ambient-companion](./ambient-companion/SKILL.md)** — Run a day-long companion session for one body of work: it watches the event streams (repos, change requests, pipelines, tracker), moves each item through workers and independent review, and brings you only the decisions, under a written charter of what it may do alone, must ask first, and never does.

## Model-invoked

- **[charter](./charter/SKILL.md)** — Look up and record what the agent may do alone, must ask first, or must never do, per scope, in your charter ledger. The other workflow skills read their permissions from it.

- **[night-shift](./night-shift/SKILL.md)** — Unattended orchestrator run while you're away: a decision round up front, then a self-paced loop that takes tickets through worker, verify, review, smoke, MR and merge, plus backend, package and deploy watches, ending in a morning report.
