# Community flows

Flows written by people outside this repo. Each one is a folder in `community/flows/<name>/` with the same files as a shipped flow: `SKILL.md`, `flow.yaml` and `agents/openai.yaml`, registered in `.claude-plugin/plugin.json`.

## How a flow gets in

1. Write it with `/new-flow`, or by hand from [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-flow). A flow only chains units that already exist in this repo. A new unit is its own pull request, reviewed first.
2. Fill `flow.yaml`, checked against [schemas/flow.schema.json](../schemas/flow.schema.json). Set `trust: experimental`.
3. Open a pull request. CI runs `./scripts/check.sh` and a secret scan:
   - the manifest is valid and agrees with `SKILL.md` (units, order, slots, stops);
   - every unit exists and can be called by a flow;
   - every risky effect (push, merge, post, ticket changes, releases, deletes, installs) waits on a stop;
   - no secrets.
4. A maintainer reads the prose. A valid manifest can still sit next to unsafe instructions, so the text gets a human review, line by line.

## Trust

| Label | Who | What it may do |
|---|---|---|
| `core` | shipped and maintained here, in `skills/flows/` | may lean on your charter for risky effects |
| `reviewed` | a community flow a maintainer reviewed and is willing to keep | may lean on your charter for risky effects |
| `experimental` | a new community flow | may not lean on the charter: every risky effect waits on a stop, whatever your charter grants |

A flow moves from `experimental` to `reviewed` in its own pull request, after people have run it.
