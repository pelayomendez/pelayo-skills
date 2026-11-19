<p align="center"><img src="assets/icon-sticker.png" width="128" alt=""></p>

# yatsude

More arms for your everyday work. [Landing page](https://pelayomendez.github.io/yatsude/).

A composable framework for AI-driven everyday work. **Skills** each do one job. **Flows** chain them into the loops you run every day: your bug queue, MR reviews, backlog, the night shift. And when your loop isn't here, you **write your own flow**: one markdown file, no code. Slots let you plug in your own skills, and a charter (a plain-text permissions file) says what needs you.

The name is Japanese: *yatsude* (八つ手), "eight hands".

I use these to automate code production. The coding agents are the machines; these skills run the line around them: what to build next, who may do what, launching work, checking it, watching it and handing it over. The point is to supervise from **on the loop** (change the system when a result is wrong) instead of **in the loop** (redo each result by hand).

A factory is the easiest way to see what is here:

| On the line | Skills |
| --- | --- |
| production planning | `backlog` |
| repair line | `support` |
| final inspection | `mr-review` |
| work orders | `delegate`, `ticket-pick` |
| incoming inspection | `qualify` |
| quality control | `verify-claim`, `ui-check`, `review-change` |
| control panel | `watch` |
| status board | `tracker-move` |
| permits and safety rules | `charter` |
| shift handover | `handoff` |
| the night shift and the day supervisor | `night-shift`, `ambient-companion` |
| maintenance | `tidy`, `reap-procs` |

It is not a full factory, and not a "dark" one with nobody watching: a person stays on the loop.

## Start here

| You have | Type |
| --- | --- |
| bugs piling up in a queue | `/support <config>` |
| MRs waiting for review, yours and your team's | `/mr-review <config>` |
| a backlog nobody trusts any more | `/backlog <scope>` |
| tickets ready and a night ahead | `/night-shift` |
| a day of agents running while you do something else | `/ambient-companion` |
| one job only: check a claim, review one MR, hand off | nothing; ask for it and the agent picks the unit |

## Write your own flow

Type `/new-flow` and describe a loop you run by hand. It maps each step to a skill you have, marks where the flow must stop for you (checking your charter), writes the file and checks it with `check-flow`. Steps no skill covers become a new small unit or a stop, never logic inside the flow.

Or write it yourself: a flow is a skill file with a `## Units` list (the skills it uses), the steps in order, and where it stops for you. Put it in `~/.claude/skills/<name>/SKILL.md` and `/<name>` runs it; the flow-map pane lists it next to the shipped ones.

```markdown
---
name: hotfix
description: "One urgent bug, report to MR."
summary: "One urgent bug, report to MR"
disable-model-invocation: true
---

## Units

Steps, in order:

- `verify-claim`
- `delegate`
- `review-change`
- `ui-check`

## Steps

1. Confirm the cause with `verify-claim`.
2. `delegate` the fix to a worker.
3. `review-change` at the new head.
4. `ui-check` it locally.
5. **Stop:** show the MR and ask before merging.
```

The shipped flows are worked examples: [support](./skills/flows/support/SKILL.md) shows a full one, with what to do when a step fails.

## Where it stops for you

Nothing is merged, pushed or posted under your name unless you said so, in the chat or in your [charter](./skills/workflow/charter/SKILL.md): a plain-text file of what the agent may do alone, must ask first, or never does. A permission only counts when it comes from you.

| Flow | Does alone | Asks you first | Never does alone |
| --- | --- | --- | --- |
| `/support` | qualify, confirm the cause, pick, fix, review, local browser check | the first bug; the MR text, merge and release unless your charter grants them; after three review rounds; a check that passes locally and fails on the test environment | merge without a green pipeline and a passing review on the same commit; touch others' tickets |
| `/mr-review` | list the MRs, review each read-only, verify the findings | your call on every MR; each push and merge on yours; each comment on theirs | push to, approve or merge a teammate's MR |
| `/backlog` | read the backlog, propose what can close, rank the rest | every close or change, by id; value and deadlines it can't infer | close a ticket by age alone; bulk changes |
| `/night-shift` | worker → verify → review → browser check → MR, and merges you granted that night | one decision round before you leave; comments wait in the handoff | merge without all three gates on the commit, or while the pipeline is pending |
| `/ambient-companion` | spawn and watch workers, verify, review, keep the tracker consistent | anything under your name, merges and releases, destructive cleanup, another team's system | force-push, rewrite shared docs, install software, stop what it didn't start |

## Your first run

1. **Install** the plugin (see [Install](#install)), then open a new session.
2. **Start read-only:** `/backlog <epic, label or query>`. It reads your tracker, proposes what can close with evidence, ranks the rest, and changes nothing until you approve ids.
3. **Write a flow config** for `/support` and `/mr-review`: copy [examples/flow-config.md](./examples/flow-config.md) to `~/.claude/flows/<name>.md` and fill what you know. The flow asks once for anything missing and writes it back.
4. **Review one MR:** `/mr-review <MR or PR URL>`. Nothing is posted; you get a report and decide.
5. **Fix one bug:** `/support ~/.claude/flows/<name>.md <KEY>`. It stops before the first bug, and again wherever the table above says.

## What's inside

Small units that each do one job, and flows that chain them. A unit works on its own; a flow only decides the order and where it stops for you.

### Always on

| Name | What it does |
| --- | --- |
| [high-level-communication](./instructions/high-level-communication.md) | Report like a senior engineer to another: concepts and outcomes over files; why, what changed, impact, trade-offs, risks, next steps. |
| [check-the-charter](./instructions/check-the-charter.md) | Before anything sensitive, the agent checks your charter with the `charter` unit. |

### Flows

| Flow | Chains | What you get |
| --- | --- | --- |
| [`/backlog <scope>`](./skills/flows/backlog/SKILL.md) | snapshot-backlog → code-check → prune-backlog → verify-claim → your OK → order-backlog | A cleaner backlog, closed only on checked evidence, and a ranked queue with one reason per ticket. |
| [`/ambient-companion`](./skills/flows/ambient-companion/SKILL.md) | charter → verify-claim on what's in flight → watch → each tick: delegate → verify-claim → handoff | A day-long companion that watches your work's event streams, keeps workers moving, and brings you only the decisions. |
| [`/night-shift`](./skills/flows/night-shift/SKILL.md) | your decisions → charter → watch → each ticket: delegate → verify-claim → merge if granted → handoff | An unattended overnight run through worker, checks, MR and merge, ending in a morning report and a plan for the day. |
| [`/support <config>`](./skills/flows/support/SKILL.md) | qualify → code-check → your OK → each bug: verify-claim → ticket-pick → delegate (fix, review) → ui-check → watch → merge on your OK or a charter grant → ui-check on the test environment → close | A bug queue worked from report to released, one bug at a time, with the status board updated at every step. |
| [`/mr-review <config>`](./skills/flows/mr-review/SKILL.md) | list open MRs → review-change → verify-claim → you validate each MR → yours: fix and push on your word, merge on your word, check on the test environment, close · theirs: comments on your OK | Every open MR reviewed at its current head, and a decision card per MR. Nothing merged or posted without you. |
| [`/tune-repo <repo> [areas]`](./skills/flows/tune-repo/SKILL.md) | charter → reap-procs → one worker per area (tests, architecture, deps, bundle, retro) through delegate → verify-claim on the top findings → morning handoff | One ranked report on a repo's tests, architecture, dependencies, bundle and recent agent sessions, audited overnight. Changes no code; you grill it and decide each item. |

### Bring your own skills

The flows are the line; the skills that do the heavy jobs on it can be yours. A flow hands jobs to workers, and each is a **slot** you can fill with a skill you already trust:

| Slot | The job | Default | Used by |
| --- | --- | --- | --- |
| `implement` | write the fix or the feature in its own worktree, and commit | a test-first fix | `/support`, `/mr-review`, `/night-shift` |
| `review` | review one change at one commit: findings with file and line, and a verdict | `review-change`'s spec and standards review | `/support`, `/mr-review`, `/night-shift` |
| `browser-check` | run a written check in a controlled browser | `ui-check` | `/support`, `/mr-review`, `/night-shift` |
| `tests`, `architecture`, `deps`, `bundle`, `retro` | audit one area of a repo into one ranked file | the methods in [tune-repo's areas](./skills/flows/tune-repo/references/areas.md); `deps-audit`, `bundle-audit` | `/tune-repo` |

Name your skill in a slots file, `~/.claude/slots.md`, or per flow in its config under `## Slots`, one line per slot (`agent:<name>` for a subagent type):

```
- implement: coding-skills:tdd
- review: coding-skills:code-review
- tests: coding-skills:test-review
```

Your skill answers in its own words. The unit around it (`delegate`, `review-change`, `ui-check`) gives it what it needs, checks what comes back, writes the report and keeps every stop and every never of the flow. Your skill doesn't need to know our formats. If it isn't installed, the default runs and the report says so. The contracts are in [delegate's slots reference](./skills/workflow/delegate/references/slots.md).

### Flow map

A pane beside the chat that lists your flows (with their steps) and units, one line each. Click one and it goes into the prompt. It ships as a separate plugin, so the skills stay plain markdown; install it with the skills (see [Install](#install)). Details: [plugins/flow-map](./plugins/flow-map/README.md).

### Units

| Name | What it does | How it starts |
| --- | --- | --- |
| [charter](./skills/workflow/charter/SKILL.md) | One ledger of what the agent may do alone, must ask first, or never, per scope, recorded in your own words. Ships two opt-in guard hooks. | Agent picks it up |
| [verify-claim](./skills/workflow/verify-claim/SKILL.md) | Checks an agent's claim ("it's done", "the worker fixed it") with a fresh subagent that sees only the claim and its evidence. | Agent picks it up |
| [review-change](./skills/workflow/review-change/SKILL.md) | Reviews one MR or PR at its head SHA, read-only, against its ticket and the repo's rules, with verified findings in one report. | Agent picks it up |
| [snapshot-backlog](./skills/workflow/snapshot-backlog/SKILL.md) | Reads a backlog scope into one local file the other units work from. Read only. | Agent picks it up |
| [code-check](./skills/workflow/code-check/SKILL.md) | Reads the code side of tickets: merged and open MRs, what is released and deployed, stale MRs, MRs with no ticket. Read only. | Agent picks it up |
| [prune-backlog](./skills/workflow/prune-backlog/SKILL.md) | Proposes which tickets can close, each with evidence, never by age alone. | Agent picks it up |
| [order-backlog](./skills/workflow/order-backlog/SKILL.md) | Ranks tickets by value, urgency and size (WSJF) inside the dependency graph, ships bundles together, names the critical path, finds a home for untracked work, and marks which are ready to start. | Agent picks it up |
| [delegate](./skills/workflow/delegate/SKILL.md) | Writes a self-sufficient brief to a file and launches a worker in its own worktree, with the standing forbids in every brief. | Agent picks it up |
| [watch](./skills/workflow/watch/SKILL.md) | Watches a pipeline, MR, deploy or package version for one exact revision against a baseline, and reports changes. Never starts work. | Agent picks it up |
| [qualify](./skills/workflow/qualify/SKILL.md) | Researches each reported bug and labels it ready for an agent, or names the missing question. Never fixes. | Agent picks it up |
| [ticket-pick](./skills/workflow/ticket-pick/SKILL.md) | Checks a ready ticket is still ready and free, then takes it into work: In Progress, assigned, sprint and points. | Agent picks it up |
| [ui-check](./skills/workflow/ui-check/SKILL.md) | Checks a change in a controlled browser, locally or on a test environment, after making sure the port and the browser are free. | Agent picks it up |
| [deps-audit](./skills/workflow/deps-audit/SKILL.md) | Lists the dependencies a repo could drop, swap, dedupe or update, each with evidence. Tools only inside a throwaway worktree; changes nothing. | Agent picks it up |
| [bundle-audit](./skills/workflow/bundle-audit/SKILL.md) | Builds a web app and measures what it ships, tracing each heavy piece to the import that brings it in. Changes nothing. | Agent picks it up |
| [check-flow](./skills/workflow/check-flow/SKILL.md) | Checks one flow file before it runs: its units exist and can be called, and every push, merge or post has a stop or a charter check. Changes nothing. | Agent picks it up |
| [tracker-move](./skills/workflow/tracker-move/SKILL.md) | Moves one item between the sections of a status board kept in a ticket's description, leaving the rest untouched. | Agent picks it up |
| [handoff](./skills/workflow/handoff/SKILL.md) | Writes the one size-capped file a supervising session resumes from: state and owners, watches to re-arm, the charter scope in force. | Agent picks it up |
| [reap-procs](./skills/maintenance/reap-procs/SKILL.md) | Finds what is eating the machine after agent sessions, says whose each process is, and stops only what nobody owns. Before a fan-out, says go or wait. | Agent picks it up |
| [new-flow](./skills/authoring/new-flow/SKILL.md) | Writes your own flow with you: a skill per step, stops from your charter, the file, then `check-flow`. Missing steps become new units or stops. | You type `/new-flow` |
| [tidy](./skills/maintenance/tidy/SKILL.md) | A weekly and monthly tune-up of your agent setup: retro, memory, steering files, skills, permissions, hooks. A session-start hook reminds you when a pass is due. | You type `/tidy` |

### How things start

- **Always on**: an *instruction*, imported into your global agent memory. It costs context in every session, so it is kept for how to behave at all times.
- **You type**: a *user-invoked skill*. Every flow is one.
- **Agent picks it up**: a *model-invoked skill*. The agent loads it when the task matches; you can also type it. Every unit a flow calls is one, because a skill you type can't call another skill you type.

Units pass work through files with fixed names (for `/backlog`: `tickets.json`, `prune.md`, `queue.md` in one folder per run; for the long-running flows: `brief.md`, `watches.md`, `handoff-<date>.md`), so a run survives a `/clear` and any unit can pick up where another left off. Details in [`.agents/invocation.md`](./.agents/invocation.md).

## Install

**Needs:** Claude Code. The flows that touch tickets and MRs use your tracker's CLI or MCP (for Jira, `acli`) and your forge's CLI (`glab` or `gh`); browser checks use a controlled-browser MCP (for example chrome-devtools), never your own browser. `/backlog` only reads, so it is the safest first run.

Instructions and skills install separately, because one is always loaded and the other is loaded on demand.

### Skills

As a Claude Code plugin, a read-only bundle you subscribe to:

```
/plugin marketplace add pelayomendez/yatsude
/plugin install yatsude@yatsude
/plugin install flow-map@yatsude   # optional pane
```

The plugin also installs the one hook `tidy` needs: a session-start reminder that prints a line only when a pass is due (`TIDY_REMIND=0` silences it).

Or with [skills.sh](https://skills.sh), which copies them into your project so you can hack on them (no hook; install one way, not both, or you get every skill twice):

```bash
npx skills@latest add pelayomendez/yatsude
```

### Instructions

```bash
git clone https://github.com/pelayomendez/yatsude
cd yatsude
./scripts/install-instructions.sh          # or --dry-run first
```

This symlinks each file in `instructions/` into `~/.claude/` and appends an `@import` line to `~/.claude/CLAUDE.md`. Because it symlinks, editing this repo takes effect immediately. Re-running is a no-op, and an existing regular file is backed up rather than overwritten. Target another agent with `AGENT_HOME=~/.codex ./scripts/install-instructions.sh`. Open a new session for the import to take effect.

## Layout

```
instructions/            always-on instructions
skills/flows/            flows you type: backlog, ambient-companion, night-shift, support, mr-review, tune-repo
skills/authoring/        /new-flow: write your own flow from the skills you have
skills/maintenance/      upkeep of the agent setup and the machine
skills/workflow/         units for running agent work: permissions, backlogs, workers, watches, handoffs
plugins/flow-map/        the flow map pane, a separate plugin
examples/                a flow config to copy for /support and /mr-review
```

Each bucket has its own README.

## Troubleshooting

- **"Unknown command" for a flow**: open a new session; skills load when a session starts. If you installed with skills.sh, check the skill's folder is in `~/.claude/skills` or the project's `.claude/skills`.
- **Every skill listed twice**: it was installed both as a plugin and with skills.sh. Keep one.
- **A flow stops asking for a CLI**: the tracker or forge CLI isn't installed or logged in (`acli`, `glab`, `gh`). The flow never installs software; install it yourself, then rerun.
- **Browser checks are skipped**: no controlled-browser MCP is configured, or another session holds it. The report says the check didn't run; it never falls back to your own browser.

## FAQ

- **Does it push or merge without me?** Only what your charter grants for that flow, and never against the "never" column above. With an empty charter it asks every time.
- **GitHub or GitLab? Jira or something else?** The flows name the step, not the tool: your config says which CLI or MCP to use. Examples use `acli`, `glab` and `gh`.
- **Other agents than Claude Code?** Written and tested on Claude Code. The skills are plain markdown and the instructions install for other agents (`AGENT_HOME`), but the flows rely on Claude Code's subagents and hooks.
- **Can I use my own review or TDD skill?** Yes: see [Bring your own skills](#bring-your-own-skills).

## Working on this repo

```bash
npm run check    # validate instructions and skills
npm run list     # show everything, by how it starts
```

`check` enforces the conventions that fail silently at runtime: unquoted YAML descriptions, frontmatter leaking into an always-on instruction, invocation mode out of sync between harnesses, the context budget on instruction files, and flows calling units that don't exist or can't be reached. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) to add something.


## License

MIT
