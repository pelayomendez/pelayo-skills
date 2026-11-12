# Support flow: working notes

Status: being built from real runs, one unit at a time. First installation: a frontend app's bug epic.
Review the cut of the units once the flow runs end to end.

## Shape

intake (sources) → triage → fix → ship → verify → close, with `tracker-move` on every state change.

- **Intake**: pluggable sources that each yield items: an epic, a label, a JQL query, error tracking, a manual feed.
- **Triage**: reproduce, validate, rewrite the report, size it; then ready / waiting on a decision / needs info.
- **Fix**: worktree → implementer → reviewer loop (several rounds are normal; cap at 3) → browser check.
- **Ship**: push + MR → watch the pipeline → merge (charter) → release to the test environment → watch the deploy.
- **Verify**: the same browser check against the test environment.
- **Close**: ticket Done, board Released, worktree removed, report back to the reporter (ask-first post).

Each unit ends `done`, `blocked <reason>` or `needs-you <exact question>`. Per-item state lives in a ledger file, which works as a cache: the tracker and the forge are the truth.

## Units

| Unit | Status | Notes |
|---|---|---|
| tracker-move | built | first real use: 2026-11-12 |
| ticket-pick | todo | readiness check + In Progress + assign + sprint/points |
| ui-check | todo | check prompt + URL in a controlled browser; starts the app the way the repo needs it |
| capacity | todo | who holds the dev port, the browser, the agent slots |
| watch | exists | parse forge JSON leniently (raw control chars in MR bodies) |
| delegate | exists | implementer and reviewer briefs |
| charter | exists | merge, tag/deploy and posts are ask-first |
| support-report | todo | queue by state, untriaged items, items outside the intake, throughput; first done by hand 2026-11-12 |
| release adapter | per installation | e.g. tag → manifest → environment sync |

## Lessons from runs

- 2026-11-12: the local check needs the app's standalone mode. A federated dev server can't route a project URL.
- 2026-11-12: another agent's dev server held the port, so the check waited. `capacity` has to come before `ui-check`.
- 2026-11-12: the review took three rounds (scope gap, then boundary import). The implementer stopped rather than work around an owned package, which is the right behaviour.
- 2026-11-12: the check project had no fixture objects. The check adds and saves fixtures in a project the agent owns.
- 2026-11-12: the forge's MR JSON broke a strict parser. The poll stopped on the parse error instead of spinning, which is the right behaviour.
- The predecessor was a single sweep command (label → worker → MR). Keep its per-item decision: skip / retry-MR / needs-info / spawn. Also keep: idempotent sweeps, reaping dead workers first, injecting ticket text into workers, and no MR without a `ready` review.
