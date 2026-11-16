# flow-map

A pane beside the Claude Code chat that shows the flows and units your skills offer. Click one and it goes into the prompt (`/backlog `, or `Use the <unit> skill: ` for a skill with no slash command), so you finish the line and press Enter. Nothing runs from the pane.

A **flow** is any skill whose `SKILL.md` has a `## Units` section listing other skills in backticks:

```markdown
## Units

Steps, in order:

- `snapshot-backlog`
- `prune-backlog`

Throughout:

- `charter`
```

The pane draws each flow with its numbered steps, then a `throughout:` line for the units any step may call. Without those two labels, every unit counts as a step in the order listed. Each skill shows its `summary:` line from the frontmatter, or else the first sentence of its description. A unit the flow lists but no folder holds shows as `name?`.

## Install

```
/plugin install flow-map --marketplace pelayomendez/pelayo-skills
```

It reads whatever skills you have: [pelayo-skills](../../README.md) or your own.

## Use it

`/flow-map` opens the pane (it also opens on start on a wide terminal). `/flow-map reload` reads the folders again after you add or change a skill.

## Settings

All in `/config`, under flow-map:

| Setting | What it does | Default |
|---|---|---|
| Skill folders | Comma-separated folders scanned for `SKILL.md`, three levels deep | `~/.claude/skills` |
| Units to list | `in-flows`, `all` or `none` | `in-flows` |
| Show only | Names to show; everything else hidden | empty |
| Hide | Names to leave out | empty |
| Order | Names that come first, in order; the rest alphabetically | empty |
| Unit groups | `Backlog: snapshot-backlog, prune-backlog; Workers: delegate, watch` | empty |
| Open on start | Open the pane when a session starts | on |

Requires Claude Code 2.1.287 or newer (plugin hooks modules).
