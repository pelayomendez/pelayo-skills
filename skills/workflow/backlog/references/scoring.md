# Scoring

## WSJF, inside the dependency graph

Weighted Shortest Job First, from Reinertsen's cost of delay divided by duration (CD3), in the form SAFe uses:

```
WSJF = (business value + time criticality + risk reduction or opportunity enablement) ÷ job size
```

Every input is **relative**, on 1, 2, 3, 5, 8, 13, 20, scored against the other tickets in scope, not in absolute terms. The smallest item in a column gets 1.

| Input | Source | Fallback |
|---|---|---|
| business value | the user | none: ask |
| time criticality | due date, release, sprint, a customer waiting | the user |
| risk reduction or enablement | how many open tickets it unblocks, directly or transitively; whether it removes a known risk | — |
| job size | points or estimate | a rough read of the description, marked *guessed* |

Order: compute WSJF, then sort so that no ticket comes before one it depends on (a topological sort that picks the highest WSJF among the tickets whose blockers are done or ranked). Ties go to the ticket that unblocks more.

Sources: [SAFe, WSJF](https://framework.scaledagile.com/wsjf) · [Black Swan Farming, WSJF](https://blackswanfarming.com/wsjf-weighted-shortest-job-first/).

## Why not RICE or ICE

RICE (reach × impact × confidence ÷ effort) needs reach, which a tracker rarely has; use it only when real usage data exists ([Intercom](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers)). ICE has the same shape and is more subjective. Both score tickets as if they were independent, which is exactly what a backlog with dependencies isn't. MoSCoW is a band, not an order: if the user thinks in must/should/could, use it to group before scoring.

## Failure modes

- **False precision.** A WSJF of 4.3 vs 4.1 is a tie. Say so.
- **Small tickets win.** Dividing by size favours small work; a strategic ticket with a large size needs its value and enablement scored honestly, or split.
- **Stale scores.** Priorities change; a ranking is good until the next planning, not forever.
