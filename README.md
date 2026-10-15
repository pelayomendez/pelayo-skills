# Pelayo's Skills

Agent instructions and skills I use for real engineering work. Small, composable, model-agnostic.

Two shapes, split by how the guidance reaches the model:

- **[Instructions](#instructions)** — always on. Imported into your global agent memory, read in every session, no trigger matching.
- **[Skills](#skills)** — on demand. Loaded when the model or you reach for them.

Which shape a thing takes is the main design decision here; see [`.agents/invocation.md`](./.agents/invocation.md).

## Instructions

### Communication

- **[high-level-communication](./instructions/high-level-communication.md)** — Communicate like a senior engineer speaking to another senior engineer. Concepts and outcomes over files and implementation details; why, what changed, impact, trade-offs, risks, next steps.

Install:

```bash
git clone https://github.com/pelayomendez/pelayo-skills
cd pelayo-skills
./scripts/install-instructions.sh          # or --dry-run first
```

This symlinks each file in `instructions/` into `~/.claude/` and appends an `@import` line to `~/.claude/CLAUDE.md`. Because it symlinks rather than copies, editing this repo takes effect immediately — no update step. Re-running is a no-op, and an existing regular file is backed up rather than clobbered.

Target another agent with `AGENT_HOME=~/.codex ./scripts/install-instructions.sh`.

Open a new session for the import to take effect.

## Skills

### Productivity — user-invoked

- **[ambient-companion](./skills/productivity/ambient-companion/SKILL.md)** — A day-long companion session that watches your work's event streams, keeps workers moving, and brings you only the decisions. Charter of alone / ask first / never, a handoff file across sessions, and a model-free watcher script so idle hours cost no tokens.

```bash
npx skills@latest add pelayomendez/pelayo-skills
```

Or as a Claude Code plugin:

```
/plugin marketplace add pelayomendez/pelayo-skills
/plugin install pelayo-skills@pelayomendez
```

skills.sh copies skills into your project so you can hack on them; the plugin keeps them as a read-only bundle you subscribe to rather than fork.

## Working on this repo

```bash
npm run check    # validate instructions and skills
npm run list     # show everything, by invocation mode
```

`check` enforces the conventions that fail silently at runtime — unquoted YAML descriptions, frontmatter leaking into an always-on instruction, invocation mode out of sync between harnesses, and the context budget on instruction files.

Convention follows [mattpocock/skills](https://github.com/mattpocock/skills).

## License

MIT
