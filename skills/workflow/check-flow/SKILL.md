---
name: check-flow
description: "Check one flow file before it runs: its frontmatter, that every unit it lists exists and can be called, that its steps use only those units, and that every push, merge, post, release or delete has a stop or a charter check in front of it. Reports problems; changes nothing. Use when a flow has just been written or edited, when another skill says to check a flow, or when the user asks whether a flow is sound."
summary: "Checks a flow file is sound"
---

# Check flow

A flow is only as safe as its weakest step. This unit reads one flow file and says what would break or overreach when it runs. It never edits the file.

## Input

- **Flow**: the path to its `SKILL.md`.
- **Available skills**: the skills this session can call. Take them from the session's own list of skills; when that list isn't visible, read the `SKILL.md` frontmatter in the user's skill folders (personal, project, and installed plugins).
- **New skills** (optional): skill files written in this run that the session can't list until a reload. The caller names their paths; count them as available, reading their frontmatter for the invocation mode.

## Checks

1. **Frontmatter.** Strict YAML with a quoted `description`; `name` matches the folder; `disable-model-invocation: true`, since a flow is something you type; a `summary` of 50 characters or fewer.
2. **Units.** A `## Units` heading lists the units, one backticked name per line, under `Steps, in order:` and, optionally, `Throughout:`. Each one:
   - exists among the available skills
   - is model-invoked: a skill only the user can start can't be reached from a flow
   - is not the flow itself
3. **Steps.** Every unit in `## Units` is used somewhere in the steps. A unit the steps name but `## Units` leaves out (often one reached through a slot) still runs, but tools that draw flows won't show it. A step that carries a long procedure of its own is logic that belongs in a unit. Plain reads and forge or tracker commands behind a stop are fine.
4. **Stops.** Find each step that publishes under the user's name, pushes, merges, releases or deploys, deletes or stops something, installs software, or writes to another team's system. Each needs either a stop that waits for the user, or a check with `charter` in front of it. One without either is the most serious finding.
5. **Failures.** The flow says what happens when a step fails or comes back unclear. A flow with no answer for that is a finding, not a blocker.
6. **Manifest**, when the flow has a `flow.yaml` beside it (the shape is the flow schema, `schemas/flow.schema.json` in yatsude): its units, order, slots and stops match the text, and every risky effect, the flow's own plus each unit's from its `unit.yaml`, is in a stop's `guards` or in `permissions.charter`. Where the repo has a check script (`npm run check` in yatsude), run it: it does this check exactly. A flow with no `flow.yaml` is advice, not a blocker, outside a repo that requires one.

## Output

`ok` or a list of findings, most serious first. Each one names the line, what goes wrong when the flow runs, and the fix in one sentence. Problems from checks 2 and 4 are `blocking`; the rest are `advice`, and never a reason to rewrite a flow that works.
