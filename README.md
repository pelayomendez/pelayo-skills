<p align="center"><img src="assets/icon-sticker.png" width="128" alt=""></p>

# pelayo-skills

On-the-loop operations for coding agents. [Landing page](https://pelayomendez.github.io/pelayo-skills/).

I use these to automate code production. The coding agents are the machines; these skills run the line around them: what to build next, who may do what, launching work, checking it, watching it and handing it over. The point is to supervise from **on the loop** (change the system when a result is wrong) instead of **in the loop** (redo each result by hand).

A factory is the easiest way to see what is here:

| On the line | Skills |
| --- | --- |
| production planning | `backlog` |
| work orders | `delegate` |
| quality control | `verify-claim` |
| control panel | `watch` |
| permits and safety rules | `charter` |
| shift handover | `handoff` |
| the night shift and the day supervisor | `night-shift`, `ambient-companion` |
| maintenance | `tidy`, `reap-procs` |

It is not a full factory, and not a "dark" one with nobody watching: a person stays on the loop. The line grows one concept at a time, from what real sessions needed.

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
| [`/backlog <scope>`](./skills/flows/backlog/SKILL.md) | snapshot-backlog → prune-backlog → verify-claim → your OK → order-backlog | A cleaner backlog, closed only on checked evidence, and a ranked queue with one reason per ticket. |
| [`/ambient-companion`](./skills/flows/ambient-companion/SKILL.md) | charter → verify-claim on what's in flight → watch → each tick: delegate → verify-claim → handoff | A day-long companion that watches your work's event streams, keeps workers moving, and brings you only the decisions. |
| [`/night-shift`](./skills/flows/night-shift/SKILL.md) | your decisions → charter → watch → each ticket: delegate → verify-claim → merge if granted → handoff | An unattended overnight run through worker, checks, MR and merge, ending in a morning report and a plan for the day. |

### Units

| Name | What it does | How it starts |
| --- | --- | --- |
| [charter](./skills/workflow/charter/SKILL.md) | One ledger of what the agent may do alone, must ask first, or never, per scope, recorded in your own words. Ships two opt-in guard hooks. | Agent picks it up |
| [verify-claim](./skills/workflow/verify-claim/SKILL.md) | Checks an agent's claim ("it's done", "the worker fixed it") with a fresh subagent that sees only the claim and its evidence. | Agent picks it up |
| [snapshot-backlog](./skills/workflow/snapshot-backlog/SKILL.md) | Reads a backlog scope into one local file the other units work from. Read only. | Agent picks it up |
| [prune-backlog](./skills/workflow/prune-backlog/SKILL.md) | Proposes which tickets can close, each with evidence, never by age alone. | Agent picks it up |
| [order-backlog](./skills/workflow/order-backlog/SKILL.md) | Ranks tickets by WSJF inside the dependency graph and marks which are ready to start. | Agent picks it up |
| [delegate](./skills/workflow/delegate/SKILL.md) | Writes a self-sufficient brief to a file and launches a worker in its own worktree, with the standing forbids in every brief. | Agent picks it up |
| [watch](./skills/workflow/watch/SKILL.md) | Watches a pipeline, MR, deploy or package version for one exact revision against a baseline, and reports changes. Never starts work. | Agent picks it up |
| [handoff](./skills/workflow/handoff/SKILL.md) | Writes the one size-capped file a supervising session resumes from: state and owners, watches to re-arm, the charter scope in force. | Agent picks it up |
| [reap-procs](./skills/maintenance/reap-procs/SKILL.md) | Finds what is eating the machine after agent sessions, says whose each process is, and stops only what nobody owns. Before a fan-out, says go or wait. | Agent picks it up |
| [tidy](./skills/maintenance/tidy/SKILL.md) | A weekly and monthly tune-up of your agent setup: retro, memory, steering files, skills, permissions, hooks. A session-start hook reminds you when a pass is due. | You type `/tidy` |

### How things start

- **Always on**: an *instruction*, imported into your global agent memory. It costs context in every session, so it is kept for how to behave at all times.
- **You type**: a *user-invoked skill*. Every flow is one.
- **Agent picks it up**: a *model-invoked skill*. The agent loads it when the task matches; you can also type it. Every unit a flow calls is one, because a skill you type can't call another skill you type.

Units pass work through files with fixed names (for `/backlog`: `tickets.json`, `prune.md`, `queue.md` in one folder per run; for the long-running flows: `brief.md`, `watches.md`, `handoff-<date>.md`), so a run survives a `/clear` and any unit can pick up where another left off. Details in [`.agents/invocation.md`](./.agents/invocation.md).

## Install

Instructions and skills install separately, because one is always loaded and the other is loaded on demand.

### Skills

As a Claude Code plugin, a read-only bundle you subscribe to:

```
/plugin marketplace add pelayomendez/pelayo-skills
/plugin install pelayo-skills@pelayomendez-skills
```

The plugin also installs the one hook `tidy` needs: a session-start reminder that prints a line only when a pass is due (`TIDY_REMIND=0` silences it).

Or with [skills.sh](https://skills.sh), which copies them into your project so you can hack on them (no hook; install one way, not both, or you get every skill twice):

```bash
npx skills@latest add pelayomendez/pelayo-skills
```

### Instructions

```bash
git clone https://github.com/pelayomendez/pelayo-skills
cd pelayo-skills
./scripts/install-instructions.sh          # or --dry-run first
```

This symlinks each file in `instructions/` into `~/.claude/` and appends an `@import` line to `~/.claude/CLAUDE.md`. Because it symlinks, editing this repo takes effect immediately. Re-running is a no-op, and an existing regular file is backed up rather than overwritten. Target another agent with `AGENT_HOME=~/.codex ./scripts/install-instructions.sh`. Open a new session for the import to take effect.

## Layout

```
instructions/            always-on instructions
skills/flows/            flows you type: backlog, ambient-companion, night-shift
skills/maintenance/      upkeep of the agent setup and the machine
skills/workflow/         units for running agent work: permissions, backlogs, workers, watches, handoffs
```

Each bucket has its own README.

## Working on this repo

```bash
npm run check    # validate instructions and skills
npm run list     # show everything, by how it starts
```

`check` enforces the conventions that fail silently at runtime: unquoted YAML descriptions, frontmatter leaking into an always-on instruction, invocation mode out of sync between harnesses, the context budget on instruction files, and flows calling units that don't exist or can't be reached. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) to add something.


## License

MIT
