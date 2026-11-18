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

## Checks

1. **Frontmatter.** Strict YAML with a quoted `description`; `name` matches the folder; `disable-model-invocation: true`, since a flow is something you type; a `summary` of 50 characters or fewer.
2. **Units.** A `## Units` heading lists the units, one backticked name per line, under `Steps, in order:` and, optionally, `Throughout:`. Each one:
   - exists among the available skills
   - is model-invoked: a skill only the user can start can't be reached from a flow
   - is not the flow itself
3. **Steps.** Every unit named in the steps is in `## Units`, and every unit in `## Units` is used somewhere. A step that does real work without a unit (a script, a long procedure) is logic that belongs in a unit of its own: flag it.
4. **Stops.** Find each step that publishes under the user's name, pushes, merges, releases or deploys, deletes or stops something, installs software, or writes to another team's system. Each needs either a stop that waits for the user, or a check with `charter` in front of it. One without either is the most serious finding.
5. **Failures.** The flow says what happens when a step fails or comes back unclear. A flow with no answer for that is a finding, not a blocker.

## Output

`ok` or a list of findings, most serious first. Each one names the line, what goes wrong when the flow runs, and the fix in one sentence. Problems from checks 2 and 4 are `blocking`; the rest are `advice`.
