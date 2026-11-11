# Workflow

Long-running sessions that drive other agents.

## User-invoked

- **[ambient-companion](./ambient-companion/SKILL.md)** — Run a day-long companion session for one body of work: it watches the event streams (repos, change requests, pipelines, tracker), moves each item through workers and independent review, and brings you only the decisions, under a written charter of what it may do alone, must ask first, and never does.

## Model-invoked

- **[night-shift](./night-shift/SKILL.md)** — Unattended orchestrator run while you're away: a decision round up front, then a self-paced loop that takes tickets through worker, verify, review, smoke, MR and merge, plus backend, package and deploy watches, ending in a morning report.
