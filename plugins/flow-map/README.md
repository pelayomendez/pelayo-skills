# flow-map

The yatsude panel: a pane beside the Claude Code chat that shows the flows and units your skills offer. Click one and it goes into the prompt (`/backlog `, or `Use the <unit> skill: ` for a skill with no slash command), so you finish the line and press Enter. Nothing runs from the pane.

A **flow** is any skill whose `SKILL.md` has a `## Units` section listing other skills in backticks:

```markdown
## Units

Steps, in order:

- `snapshot-backlog`
- `prune-backlog`

Throughout:

- `charter`
```

The pane opens with the yatsude octopus (on a wide enough pane) and two buttons: **+ new flow** puts `/new-flow ` in the prompt, and **↻** reads the folders again.

Each flow shows as a chain of its steps, with an amber ⏸ where it stops for you (`qualify ⏸ → verify-claim → …`; a stop goes after the last step the flow names before it), then an `also uses:` line for the units any step may call (listed under `Throughout:` in the flow). Without those two labels, every unit counts as a step in the order listed. Next to the flow's name:

- **⏸ N stops** in amber: how many places it stops for you, counted from steps marked `**Stop and ask**` or `**N. Stop: …**`.
- **yours** in teal: the flow's folder is your own, not a link into a collection you installed.
- **edit**: puts `/new-flow edit <flow> ` in the prompt.

Below the flows, each unit shows on one line with its `summary:` (or else the first sentence of its description). Type in **filter units** to narrow them by name or summary, and press **▾ compact** to show names only. Hover a unit and it lights up in every flow that uses it. A unit the flow lists but no folder holds shows as `name?`.

## Install

```
/plugin marketplace add pelayomendez/yatsude
/plugin install flow-map@yatsude
```

It reads the skill folders you point it at, by default `~/.claude/skills`: [yatsude](../../README.md) or your own. Skills that came from an installed plugin live elsewhere (under `~/.claude/plugins/`) and are typed with the plugin's name (`/yatsude:backlog`); flow-map fills the plain `/backlog`, so for those, link or install the skills into `~/.claude/skills` (for example with `npx skills add`).

A click puts the skill at the start of the prompt and keeps anything you had typed after it. Nothing is sent until you press Enter.

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
