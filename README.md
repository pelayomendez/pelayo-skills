# Pelayo's Skills

Agent skills I use for real engineering work. Small, composable, model-agnostic.

## Quickstart

```bash
npx skills@latest add pelayomendez/pelayo-skills
```

Pick the skills you want and which coding agents to install them on. Works with Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot and other Agent-Skills-standard harnesses.

## Install as a Claude Code plugin

Inside Claude Code:

```
/plugin marketplace add pelayomendez/pelayo-skills
/plugin install pelayo-skills@pelayomendez
```

Or from your shell:

```bash
claude plugin marketplace add pelayomendez/pelayo-skills
claude plugin install pelayo-skills@pelayomendez
```

Two installs, two philosophies:

- **skills.sh** copies the skills into your project so you can hack on them.
- **The plugin** keeps them as a read-only, always-current bundle you subscribe to rather than fork.

## The skills

### Communication

**Model-invoked**

- **[high-level-communication](./skills/communication/high-level-communication/SKILL.md)** — Report work like a senior engineer talking to another senior engineer: why, what changed, impact, next step — never a file-by-file narration.

## Conventions

Skills split on one axis — **who can invoke them**. Model-invoked skills carry rich trigger phrasing so the model reaches for them autonomously; user-invoked skills are reachable only when you type their name. See [`.agents/invocation.md`](./.agents/invocation.md).

Convention follows [mattpocock/skills](https://github.com/mattpocock/skills).

## License

MIT
