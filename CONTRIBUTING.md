# Contributing

## Choosing the shape

Before writing anything, decide whether it's an **instruction** or a **skill** — read [`.agents/invocation.md`](./.agents/invocation.md).

The test: does this apply *always*, or *sometimes*? Register, altitude and house style are always — they belong in `instructions/`. A procedure you reach for under specific conditions is sometimes — that's a skill. Never ship the same guidance as both.

## Adding an instruction

1. Create `instructions/<name>.md`. Plain Markdown, opening with an H1, **no YAML frontmatter** — the file is imported verbatim into global memory and frontmatter would land in context as literal noise.
2. Keep it under 80 lines. It costs context in every session forever, so it has to earn the space.
3. Add it to the top-level `README.md` under **Instructions**.
4. Run `npm run check`.

Installed by `./scripts/install-instructions.sh`, which symlinks it into `~/.claude/` and appends the `@import` line.

## Adding a skill

1. Pick a bucket under `skills/` (or create one, with a `README.md` split into **User-invoked** / **Model-invoked**).
2. Create `skills/<bucket>/<skill-name>/SKILL.md`. `name` must match the directory name.
3. Decide invocation. Default to model-invoked; the test is _could the model usefully reach for this autonomously?_
4. Add `agents/openai.yaml` beside the `SKILL.md` with `interface.display_name` and `interface.short_description`. For a user-invoked skill also add `policy.allow_implicit_invocation: false`.
5. Register the skill path in `.claude-plugin/plugin.json` under `skills` — a skill absent from that array will not load as a plugin.
6. Add it to the bucket `README.md` and the top-level `README.md`.
7. Run `npm run check`.

## Rules that bite

- **Quote the `description`.** An unquoted value containing `: ` is invalid YAML; Claude Code tolerates it, `npx skills` silently skips the skill.
- **No frontmatter in `instructions/`.** Same file shape, opposite rule from skills — easy to get backwards.
- **Keep both harnesses in sync.** `disable-model-invocation: true` and `policy.allow_implicit_invocation: false` travel together.
- **No cross-skill file links.** Invoke by prose (`Run the /other-skill skill`), don't reach into `../other-skill/`.
- **Bump `version` in `.claude-plugin/plugin.json`** when you change what plugin subscribers receive.
