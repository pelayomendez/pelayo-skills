# Model-invoked vs user-invoked

Every `SKILL.md` in this repo is a skill. The one axis that splits them is **invocation** — who can reach it.

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

## READMEs

Bucket `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**.

---

This convention follows [mattpocock/skills](https://github.com/mattpocock/skills), which established the two-axis split and the `agents/openai.yaml` sidecar.
