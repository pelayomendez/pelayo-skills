# Flows

A flow is a skill you type that only chains units: it sets the order, says where it stops for you, and says what happens when a unit fails. Each unit also works on its own.

## User-invoked

- **[backlog](./backlog/SKILL.md)**: `snapshot-backlog` → `prune-backlog` → `verify-claim` → your OK → `order-backlog`. Tidies an existing backlog: closes only what has checked evidence against it, and orders the rest into a ranked queue with one reason per ticket.
- **[ambient-companion](./ambient-companion/SKILL.md)**: `charter`, then each tick `watch` → `delegate` → `verify-claim`, with `handoff` at the end of the day. A day-long companion for one body of work: it watches the event streams (repos, change requests, pipelines, tracker), moves each item through workers and independent review, and brings you only the decisions.
- **[night-shift](./night-shift/SKILL.md)**: a decision round, `charter` and `watch` before you leave, then per ticket `delegate` → `verify-claim` → merge if granted, all logged with `handoff`. An unattended overnight run that ends in a morning report and a plan for the day.
