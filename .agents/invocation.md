# Invocation

This repo holds two kinds of artifact, and the axis that separates them is **invocation** — what has to happen for the guidance to reach the model.

## Always-on instructions (`instructions/`)

Plain Markdown, no frontmatter, imported verbatim into the global memory file (`~/.claude/CLAUDE.md`) with an `@import` line by `scripts/install-instructions.sh`. No trigger matching, no discretion: the model reads it in every session.

Use this shape when the guidance describes **how to behave at all times** — register, altitude, house style. A model-invoked skill is the wrong mechanism for that, because it fires only when the model judges the moment to match, and "always" is not a moment.

The cost is permanent context, in every session, forever. So keep instruction files short — the validator enforces an 80-line budget — and reserve the shape for guidance that genuinely applies everywhere. Anything situational belongs in a skill.

## Skills (`skills/`)

Every `SKILL.md` is a skill, loaded on demand. Two sub-modes, split by who can reach it.

- **Model-invoked** — reachable by **model or user**. The default: omit `disable-model-invocation`, and omit the `policy` block from `agents/openai.yaml`. The `description` is **model-facing** and keeps rich trigger phrasing ("Use when the user wants…, mentions…, asks for…") so auto-invocation fires. The test: _could the model usefully reach for this autonomously?_
- **User-invoked** — reachable **only by the human typing its name**. Set `disable-model-invocation: true` in the frontmatter (Claude Code) and `policy.allow_implicit_invocation: false` in `agents/openai.yaml` (Codex). The `description` is **human-facing**: a one-line summary read by a person browsing slash-commands. Strip trigger lists.

Keep the two harnesses in sync: a skill is user-invoked in **both** or **neither**.

## Frontmatter must be strict YAML

Quote the `description` (or use a `>-` block scalar). An unquoted value containing `: ` parses as a nested mapping and strict YAML parsers reject the whole file — Claude Code's lenient parser will accept it while `npx skills` silently skips the skill.

## Every skill carries an `agents/openai.yaml`

Beside its `SKILL.md`. It holds Codex UI metadata — `interface.display_name` and `interface.short_description` for the skill picker — plus, for user-invoked skills only, the `policy.allow_implicit_invocation: false` that pairs with `disable-model-invocation`.

## Dependencies between skills

Express dependencies as **`/skill`-style prose invocation** ("Run the `/other-skill` skill"), not as deep `../other-skill/FILE.md` cross-references. Shared reference docs live inside the skill that owns them; other skills reach that material by invoking the skill, not by linking across folders.

A user-invoked skill may invoke model-invoked skills, but it can never reach another user-invoked skill.

## Don't ship the same guidance twice

If a piece of guidance exists both as an instruction and as a skill, the two copies drift and the reader can't tell which is authoritative. Pick one shape. If something starts situational and becomes universal, move it to `instructions/` and delete the skill — don't leave both.

## READMEs

Bucket `README.md`s and the top-level `README.md` group entries into **Always-on**, **User-invoked** and **Model-invoked**.

---

This convention follows [mattpocock/skills](https://github.com/mattpocock/skills), which established the two-axis split and the `agents/openai.yaml` sidecar.
