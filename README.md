<p align="center"><img src="assets/icon-sticker.png" width="128" alt=""></p>

# pelayo-skills

Agent instructions and skills I use for real engineering work with coding agents. Small, composable, model-agnostic. [Landing page](https://pelayomendez.github.io/pelayo-skills/).

## What's inside

| Name | What it does | How it starts |
| --- | --- | --- |
| [high-level-communication](./instructions/high-level-communication.md) | Report like a senior engineer to another: concepts and outcomes over files; why, what changed, impact, trade-offs, risks, next steps. | **Always on** — read in every session |
| [check-the-charter](./instructions/check-the-charter.md) | Before anything sensitive, the agent checks your charter: one ledger of what it may do alone, must ask first, or never, per scope. | **Always on** — the reminder; the [charter skill](./skills/workflow/charter/SKILL.md) does the lookup |
| [ambient-companion](./skills/workflow/ambient-companion/SKILL.md) | A day-long companion session that watches your work's event streams, keeps workers moving, and brings you only the decisions. | **You type** `/ambient-companion` |
| [backlog](./skills/workflow/backlog/SKILL.md) | Tidy an existing backlog: prune with evidence instead of by age, map what blocks what, and propose a ranked queue (WSJF inside the dependency graph) with one reason per ticket. Nothing moves without your OK. | **You type** `/backlog <scope>` |
| [charter skill](./skills/workflow/charter/SKILL.md) | Looks up a grant before an action and records the permissions you give in your own words, with date, scope and your sentence. Ships two opt-in guard hooks for the commonest nevers. | **Agent picks it up** before sensitive actions, or you type it |
| [contract-audit](./skills/engineering/contract-audit/SKILL.md) | Find gaps in the data contract between a producer repo and a consumer repo: key drift, ignored variants, conflicting defaults, absence semantics. | **Agent picks it up** when relevant, or you type it |
| [night-shift](./skills/workflow/night-shift/SKILL.md) | An unattended overnight run: a decision round up front, then a loop that takes a ticket queue through worker, review, smoke, MR and merge, ending in a morning report. | **Agent picks it up** when relevant, or you type it |
| [reap-procs](./skills/maintenance/reap-procs/SKILL.md) | Find what is eating the machine after agent sessions — orphaned test runs, dev servers, automation Chrome, old daemons — say whose each one is, and stop only what nobody owns. | **Agent picks it up** when relevant, or you type it |
| [tidy](./skills/maintenance/tidy/SKILL.md) | A weekly and monthly tune-up of your agent setup: retro on the sessions that went badly, prune memory, audit steering files, skills, permissions and hooks. A session-start hook reminds you when a pass is due. | **You type** `/tidy` |

The three ways a thing can start are the main design decision in this repo:

- **Always on** — an *instruction*. Imported into your global agent memory, so it costs context in every session. Reserved for how to behave at all times.
- **You type** — a *user-invoked skill*. Only runs when you type its name; the agent never reaches for it alone.
- **Agent picks it up** — a *model-invoked skill*. The agent loads it when the task matches its description; you can also type it.

Details in [`.agents/invocation.md`](./.agents/invocation.md).

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
skills/engineering/      code and repo analysis
skills/maintenance/      upkeep of the agent setup and the machine
skills/workflow/         long-running sessions that drive other agents
```

Each bucket has its own README, split into user-invoked and model-invoked.

## Working on this repo

```bash
npm run check    # validate instructions and skills
npm run list     # show everything, by how it starts
```

`check` enforces the conventions that fail silently at runtime: unquoted YAML descriptions, frontmatter leaking into an always-on instruction, invocation mode out of sync between harnesses, and the context budget on instruction files. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) to add something.

Convention follows [mattpocock/skills](https://github.com/mattpocock/skills).

## License

MIT
