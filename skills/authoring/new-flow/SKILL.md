---
name: new-flow
description: "Write a new flow with you: describe a loop you run, and it maps each step to an existing skill, marks where it must stop for you, writes the flow file and checks it. Steps no skill covers come back as skills to write, never as logic inside the flow."
summary: "Writes a new flow with you"
disable-model-invocation: true
argument-hint: "[name] [what the loop does] | edit <flow>"
---

# New flow

`/new-flow` turns a loop you already run by hand into a command. You describe it; this skill builds it from the skills you have and writes one file. It never runs the flow it writes.

## Steps

With `edit <flow>`, read that flow first: show its steps as the step 2 table, ask what should change, and go through steps 2 to 7 for the changes only. Write it back after showing the difference. A flow that came with a collection (its folder is a link into it) is not edited in place: offer to save a copy under a new name.

1. **Hear the loop.** Ask for the loop in the user's own words if the argument didn't give it: what starts it, the steps, how they know it's done. Ask one question at a time and stop asking once the steps are clear. Get the name too: short, lowercase, hyphens, not the name of a skill or command that already exists.
2. **Map each step to a skill.** Read the skills this session can call: name, summary and description. For each step pick the one skill that does it. A step that needs two skills is two steps. Show the mapping as a table (step, skill, why), with the steps no skill covers marked `missing`.
3. **Settle the missing steps.** For each one, offer two ways, and let the user pick:
   - **A new unit**: one small skill that does only that job, model-invoked so the flow can call it. Write a short draft of it (frontmatter, input, steps, output) and show it before saving.
   - **A stop**: the flow pauses and the user does that step by hand.
   Never write the missing logic into the flow itself.
4. **Mark the stops.** List every step that publishes under the user's name, pushes, merges, releases or deploys, deletes or stops something, installs software, or writes to another team's system. Look each up with `charter`. Where the charter grants it, propose a charter check at run time instead of a stop; where it doesn't, the flow stops and asks. Show the list; the user confirms each charter check and may add stops of their own.
5. **Decide what happens on failure.** For each step that can fail (a unit returns `blocked`, a check fails, a claim doesn't hold), agree with the user: retry once, skip and note it, or stop and ask. The default is stop and ask.
6. **Write the file.** Ask where it goes: personal (`~/.claude/skills/<name>/`, every project) or this project (`.claude/skills/<name>/`). Write `SKILL.md` in the shape below. Don't overwrite a file that's already there.
7. **Check it** with `check-flow`, naming the units written in step 3 as new skills, and fix what it marks `blocking` before handing it over. Then say how to run it (`/<name> …`). New skills appear after a reload or a new session. A flow saved in the project folder shows in the flow-map pane only once that folder is added to the pane's sources in `/config`.

## The shape

```markdown
---
name: <name>
description: "<what the loop does and what you end up with, one sentence>"
summary: "<50 characters or fewer>"
disable-model-invocation: true
argument-hint: "<what you pass it>"
---

# <Name>

<One paragraph: what it takes, what it gives back, where it stops for you.>

## Units

Steps, in order:

- `<unit>`

Throughout:

- `charter`

## Steps

1. **<Step>.** `<unit>` on <what>. <What it hands to the next step.>
2. **Stop: <what you decide>.** Show <what>, wait for your word.

## When a step fails

- **<unit> returns blocked**: <what the flow does>.
```

Keep the steps short: a flow only sets order, stops and failures. The skills hold the method.

## Rules

- **Nothing runs.** This skill writes files after you've seen them, and only those files.
- **Use what exists.** Prefer an installed skill to a new unit, and a new unit to a stop.
- **Stops are yours.** This skill never removes one on its own: it only proposes a charter check where your charter already grants the action, and you confirm each.
