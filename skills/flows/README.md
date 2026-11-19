# Flows

A flow is a skill you type that only chains units: it sets the order, says where it stops for you, and says what happens when a unit fails. Each unit also works on its own.

## User-invoked

- **[backlog](./backlog/SKILL.md)**: `snapshot-backlog` → `code-check` → `prune-backlog` → `verify-claim` → your OK → `order-backlog`. Tidies an existing backlog: closes only what has checked evidence against it, and orders the rest into a ranked queue with one reason per ticket.
- **[night-shift](./night-shift/SKILL.md)**: a decision round, `charter` and `watch` before you leave, then per ticket `delegate` → `verify-claim` → merge if granted, all logged with `handoff`. An unattended overnight run that ends in a morning report and a plan for the day.
- **[support](./support/SKILL.md)**: `qualify` → `code-check`, then per bug `verify-claim` → `ticket-pick` → `delegate` (fix, review) → `ui-check` → ship with `watch` → `ui-check` on the test environment → close, with `tracker-move` on every state change. Works a bug queue from report to released, stopping for your OK (or a charter grant) on merges and posts.
- **[mr-review](./mr-review/SKILL.md)**: the open MRs → `review-change` at each head → `verify-claim` → you validate each one. Yours: fix with `delegate` and push on your word, merge on your word, `ui-check` on the test environment, close. Theirs: comments only on your OK.
- **[tune-repo](./tune-repo/SKILL.md)**: `charter` → `reap-procs` → one worker per area through `delegate` (tests, architecture, `deps-audit`, `bundle-audit`, retro) → `verify-claim` on the top findings → `handoff`. Audits one repo overnight into one ranked report, and stops there: you grill it and decide each item.
