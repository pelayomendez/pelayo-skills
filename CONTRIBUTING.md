# Contributing

## Adding a skill

1. Pick a bucket under `skills/` (or create one, with a `README.md` split into **User-invoked** / **Model-invoked**).
2. Create `skills/<bucket>/<skill-name>/SKILL.md`. `name` must match the directory name.
3. Decide invocation — read [`.agents/invocation.md`](./.agents/invocation.md). Default to model-invoked; the test is _could the model usefully reach for this autonomously?_
4. Add `agents/openai.yaml` beside the `SKILL.md` with `interface.display_name` and `interface.short_description`. For a user-invoked skill also add `policy.allow_implicit_invocation: false`.
5. Register the skill path in `.claude-plugin/plugin.json` under `skills` — a skill absent from that array will not load as a plugin.
6. Add it to the bucket `README.md` and the top-level `README.md`.
7. Run `./scripts/check-skills.sh`.

## Rules that bite

- **Quote the `description`.** An unquoted value containing `: ` is invalid YAML; Claude Code tolerates it, `npx skills` silently skips the skill.
- **Keep both harnesses in sync.** `disable-model-invocation: true` and `policy.allow_implicit_invocation: false` travel together.
- **No cross-skill file links.** Invoke by prose (`Run the /other-skill skill`), don't reach into `../other-skill/`.
- **Bump `version` in `.claude-plugin/plugin.json`** when you change what plugin subscribers receive.
