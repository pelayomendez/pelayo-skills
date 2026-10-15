# Handoff template

Copy to `.companion/handoff-<YYYY-MM-DD>.md`. Keep it short enough to read in two minutes.

```markdown
# Handoff — <date>

## Restart prompt
<One paragraph a fresh session can act on: the body of work, where we are, the next step.>

## Charter
- Alone: …  (set <date>: "<the human's sentence>")
- Ask first: …
- Never: …

## Event sources and triggers
| Source | Trigger | How to re-arm |
|---|---|---|
| <repo / branch> | script loop, 15 min | `bash scripts/watch.sh start` |
| <pipeline for SHA> | event wait | Monitor on the pipeline id |

## State
| Item | Stage | Owner | Evidence | Next step |
|---|---|---|---|---|
| <ticket> | review | reviewer | report file / pipeline id | fix round |

## Open — waiting on
- <item> — waiting on <person or team> since <date>

## Rules in force
- <rule> (memory: <note name>)

## Event log
- <HH:MM> <one line per event>
```
