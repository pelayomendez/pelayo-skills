<p align="center"><img src="assets/icon-sticker.png" width="128" alt=""></p>

# pelayo-skills

Agent instructions and skills I use for real engineering work with coding agents. Small, composable, model-agnostic. [Landing page](https://pelayomendez.github.io/pelayo-skills/).

## What's inside

Small units that each do one job, and flows that chain them, the way [mattpocock/skills](https://github.com/mattpocock/skills) composes `implement` out of `tdd` and `code-review`. A unit works on its own; a flow only decides the order and where it stops for you.

### Always on

| Name | What it does |
| --- | --- |
| [high-level-communication](./instructions/high-level-communication.md) | Report like a senior engineer to another: concepts and outcomes over files; why, what changed, impact, trade-offs, risks, next steps. |
| [check-the-charter](./instructions/check-the-charter.md) | Before anything sensitive, the agent checks your charter with the `charter` unit. |

### Flows

| Flow | Chains | What you get |
| --- | --- | --- |
| [`/backlog <scope>`](./skills/flows/backlog/SKILL.md) | snapshot-backlog → prune-backlog → verify-claim → your OK → order-backlog | A cleaner backlog, closed only on checked evidence, and a ranked queue with one reason per ticket. |

### Units

| Name | What it does | How it starts |
| --- | --- | --- |
| [charter](./skills/workflow/charter/SKILL.md) | One ledger of what the agent may do alone, must ask first, or never, per scope, recorded in your own words. Ships two opt-in guard hooks. | Agent picks it up |
| [verify-claim](./skills/workflow/verify-claim/SKILL.md) | Checks an agent's claim ("it's done", "the worker fixed it") with a fresh subagent that sees only the claim and its evidence. | Agent picks it up |
| [snapshot-backlog](./skills/workflow/snapshot-backlog/SKILL.md) | Reads a backlog scope into one local file the other units work from. Read only. | Agent picks it up |
| [prune-backlog](./skills/workflow/prune-backlog/SKILL.md) | Proposes which tickets can close, each with evidence, never by age alone. | Agent picks it up |
| [order-backlog](./skills/workflow/order-backlog/SKILL.md) | Ranks tickets by WSJF inside the dependency graph and marks which are ready to start. | Agent picks it up |
| [contract-audit](./skills/engineering/contract-audit/SKILL.md) | Finds gaps in the data contract between a producer repo and a consumer repo. | Agent picks it up |
| [reap-procs](./skills/maintenance/reap-procs/SKILL.md) | Finds what is eating the machine after agent sessions, says whose each process is, and stops only what nobody owns. | Agent picks it up |
| [tidy](./skills/maintenance/tidy/SKILL.md) | A weekly and monthly tune-up of your agent setup: retro, memory, steering files, skills, permissions, hooks. A session-start hook reminds you when a pass is due. | You type `/tidy` |

### Long-running sessions

| Name | What it does | How it starts |
| --- | --- | --- |
| [ambient-companion](./skills/workflow/ambient-companion/SKILL.md) | A day-long companion that watches your work's event streams, keeps workers moving, and brings you only the decisions. | You type `/ambient-companion` |
| [night-shift](./skills/workflow/night-shift/SKILL.md) | An unattended overnight run: a decision round, then a loop through worker, review, smoke, MR and merge, ending in a morning report. | Agent picks it up, or you type it |

These two are next in line to become flows once their units exist.

### How things start

- **Always on**: an *instruction*, imported into your global agent memory. It costs context in every session, so it is kept for how to behave at all times.
- **You type**: a *user-invoked skill*. Every flow is one.
- **Agent picks it up**: a *model-invoked skill*. The agent loads it when the task matches; you can also type it. Every unit a flow calls is one, because a skill you type can't call another skill you type.

Units pass work through files with fixed names (for `/backlog`: `tickets.json`, `prune.md`, `queue.md` in one folder per run), so a run survives a `/clear` and any unit can pick up where another left off. Details in [`.agents/invocation.md`](./.agents/invocation.md).

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
skills/flows/            flows: chains of units you type
skills/engineering/      code and repo analysis
skills/maintenance/      upkeep of the agent setup and the machine
skills/workflow/         units for running agent work, and the long-running sessions
```

Each bucket has its own README.

## Working on this repo

```bash
npm run check    # validate instructions and skills
npm run list     # show everything, by how it starts
```

`check` enforces the conventions that fail silently at runtime: unquoted YAML descriptions, frontmatter leaking into an always-on instruction, invocation mode out of sync between harnesses, the context budget on instruction files, and flows calling units that don't exist or can't be reached. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) to add something.

Convention follows [mattpocock/skills](https://github.com/mattpocock/skills).

## License

MIT
