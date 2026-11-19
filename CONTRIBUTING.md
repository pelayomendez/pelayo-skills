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
2. Create `skills/<bucket>/<skill-name>/SKILL.md`. `name` must match the directory name. Add a `summary:`, one line of up to 50 characters saying what it does ("Checks a bug is ready for an agent"); tools that list skills show it instead of the long description.
3. Decide invocation. Default to model-invoked; the test is _could the model usefully reach for this autonomously?_ A unit that a flow calls must be model-invoked.
4. Add `agents/openai.yaml` beside the `SKILL.md` with `interface.display_name` and `interface.short_description`. For a user-invoked skill also add `policy.allow_implicit_invocation: false`.
5. Register the skill path in `.claude-plugin/plugin.json` under `skills` — a skill absent from that array will not load as a plugin.
   For a model-invoked skill (a unit), add `unit.yaml` beside it: `schema: yatsude/unit@1`, its `name`, and its `effects` from [schemas/effects.schema.json](./schemas/effects.schema.json) (what it does beyond reading: `write-files`, `spawn`, `push`, `post`, `tracker-write`…). Flows' safety checks are built from these, so declare every effect, even the rare one.
6. Add it to the bucket `README.md` and the top-level `README.md`.
7. Run `npm run check`.

## Adding a flow

1. Build or find the units first. A flow holds no logic of its own.
2. Create `skills/flows/<name>/SKILL.md`, user-invoked, with a `## Units` list of the skills it calls.
   Split it in two: under `Steps, in order:` the units that run one after another, under `Throughout:` the ones any step may call (like `charter`). Tools that draw flows read the order from there.
3. Write the steps as calls to those units, plus where it stops for the user (`**Stop and ask**` or `**N. Stop:**`).
4. Add `flow.yaml` beside it, valid against [schemas/flow.schema.json](./schemas/flow.schema.json): the units and slots as the text lists them, the effects of the flow's own steps, one entry per stop with the risky effects it `guards`, and the risky effects left to the user's charter under `permissions.charter`. `npm run check` fails when a risky effect has neither a stop nor a charter permission, or when the manifest and the text disagree.
5. Steps 4 and 5 of *Adding a skill* apply: `agents/openai.yaml` with `policy.allow_implicit_invocation: false`, and registration in `.claude-plugin/plugin.json`.
6. Add it to `skills/flows/README.md` and to the **Flows** table in the top-level `README.md`.
7. Run `npm run check`.

A flow from outside this repo goes in `community/flows/` with `trust: experimental`: see [community/README.md](./community/README.md).

## Adding a slot

A slot is a job a flow hands to a worker where users may bring their own skill. There are three (`implement`, `review`, `browser-check`), and the bar for a fourth is a flow that needs it.

1. Write its contract in `skills/workflow/delegate/references/slots.md`: what the skill gets, the facts it must give back, its nevers, and the default.
2. The unit that wraps it (like `review-change` for `review`) turns the skill's answer into its own output. A plugged-in skill never has to learn our formats.
3. List it under `Slots` in each flow that uses it. `npm run check` fails on a slot with no contract.

## Running the check

`npm run check` (or `./scripts/check.sh`) needs Python 3 with `pyyaml` and `jsonschema`. CI runs the same script on every pull request, plus a secret scan.

## Rules that bite

- **Quote the `description`.** An unquoted value containing `: ` is invalid YAML; Claude Code tolerates it, `npx skills` silently skips the skill.
- **No frontmatter in `instructions/`.** Same file shape, opposite rule from skills — easy to get backwards.
- **Keep both harnesses in sync.** `disable-model-invocation: true` and `policy.allow_implicit_invocation: false` travel together.
- **No cross-skill file links.** Invoke by prose (`Run the /other-skill skill`), don't reach into `../other-skill/`.
- **Bump `version` in `.claude-plugin/plugin.json`** when you change what plugin subscribers receive.
