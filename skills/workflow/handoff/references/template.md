# Handoff template

Copy to `<dir>/handoff-<YYYY-MM-DD>.md`. Keep it under about 150 lines, short enough to read in two minutes. Sections stay in this order; an empty one says `none`.

```markdown
# Handoff — <YYYY-MM-DD HH:MM>

## Restart prompt
<One paragraph a fresh session can act on: the body of work, where it stands, the next step, and which flow or skill to follow.>

## State
| Item | State | Owner | Evidence | Next action |
|---|---|---|---|---|
| <ticket / MR / release> | <in review> | <worker / reviewer / user / other team> | <report file, pipeline id for <sha>, pid> | <fix round> |

## Charter in force
Scope `<scope name>` in the charter ledger (`charter` unit). Changes today:
- <HH:MM> <tier> · <action> — "<the user's sentence>"

## Watches to re-arm
| Watch | Keyed on | Baseline | Mechanism | Re-arm with |
|---|---|---|---|---|
| <ci-main> | <pipeline for full sha> | <watch-ci-main.json> | <event wait> | `<exact command>` |

## Rules in force
- <A binding product, domain or session rule> (<where it comes from: the user on <date>, memory note, design record>)

## Decisions taken on your behalf
- <HH:MM> <what was decided> — closest to <the earlier decision it follows>; reverse by <how>.

## Open questions
- <question> — blocks <item>; waiting on <person or team> since <date>

## Files that matter
- <path> — <why>

## Event log (today)
- <HH:MM> <one line per event>
```
