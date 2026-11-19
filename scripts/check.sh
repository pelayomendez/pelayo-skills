#!/usr/bin/env bash
set -euo pipefail

# Validates this repo's two artifact kinds against .agents/invocation.md.
#
# Skills — the failure modes that are silent at runtime: a description that
# isn't strict YAML, a name that drifts from its directory, a missing
# agents/openai.yaml, invocation mode out of sync between harnesses, a skill
# missing from .claude-plugin/plugin.json.
#
# Instructions — imported verbatim into a global memory file, so they must NOT
# carry YAML frontmatter (it would land in context as literal noise), must lead
# with an H1, and must stay short enough to justify permanent context cost.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 - "$REPO" <<'PY'
import json, sys, pathlib, yaml

repo = pathlib.Path(sys.argv[1])
errors = []
skills_checked = instructions_checked = 0
skill_modes = {}  # skill name -> True if user-invoked

plugin = json.loads((repo / ".claude-plugin/plugin.json").read_text())
registered = {(repo / p.lstrip("./")).resolve() for p in plugin.get("skills", [])}

CORE_SKILLS = sorted(repo.glob("skills/**/SKILL.md"))
COMMUNITY_FLOWS = sorted(repo.glob("community/flows/*/SKILL.md"))
for stray in sorted(repo.glob("community/**/SKILL.md")):
    if stray not in COMMUNITY_FLOWS:
        errors.append(f"{stray.relative_to(repo)}: community/ holds flows only, in community/flows/<name>/; a new unit is its own pull request into skills/")
core_names = {p.parent.name for p in CORE_SKILLS}
for p in COMMUNITY_FLOWS:
    if p.parent.name in core_names:
        errors.append(f"{p.relative_to(repo)}: name {p.parent.name!r} is already a core skill")
ALL_SKILLS = CORE_SKILLS + COMMUNITY_FLOWS
for skill_md in ALL_SKILLS:
    skills_checked += 1
    d = skill_md.parent
    rel = skill_md.relative_to(repo)
    text = skill_md.read_text()

    if not text.startswith("---\n"):
        errors.append(f"{rel}: missing YAML frontmatter")
        continue
    raw = text.split("---\n", 2)[1]

    try:
        fm = yaml.safe_load(raw)
    except yaml.YAMLError as e:
        line = getattr(getattr(e, "problem_mark", None), "line", None)
        where = f" (line {line + 2})" if line is not None else ""
        errors.append(f"{rel}: frontmatter is not strict YAML{where} — quote the description")
        continue

    if d.name in skill_modes:
        errors.append(f"{rel}: another skill is already named {d.name!r}")
    skill_modes[d.name] = fm.get("disable-model-invocation") is True

    if fm.get("name") != d.name:
        errors.append(f"{rel}: name {fm.get('name')!r} != directory {d.name!r}")
    if not fm.get("description"):
        errors.append(f"{rel}: no description")
    summary = fm.get("summary")
    if not summary:
        errors.append(f"{rel}: no summary (one short line for menus and panes)")
    elif len(str(summary)) > 50:
        errors.append(f"{rel}: summary is {len(str(summary))} chars, keep it to 50")

    oa_path = d / "agents/openai.yaml"
    if not oa_path.exists():
        errors.append(f"{rel}: missing agents/openai.yaml")
        continue
    oa = yaml.safe_load(oa_path.read_text()) or {}

    for key in ("display_name", "short_description"):
        if not oa.get("interface", {}).get(key):
            errors.append(f"{rel}: agents/openai.yaml missing interface.{key}")

    claude_user_only = fm.get("disable-model-invocation") is True
    codex_user_only = oa.get("policy", {}).get("allow_implicit_invocation") is False
    if claude_user_only != codex_user_only:
        errors.append(
            f"{rel}: invocation mode out of sync — "
            f"disable-model-invocation={claude_user_only}, "
            f"allow_implicit_invocation={'false' if codex_user_only else 'unset'}"
        )

    if d.resolve() not in registered:
        errors.append(f"{rel}: not registered in .claude-plugin/plugin.json")

# Flows only chain units: each must be user-invoked and list, under "## Units",
# skills that exist and are model-invoked (a user-invoked skill can't reach another).
import re
for flow in sorted(list(repo.glob("skills/flows/*/SKILL.md")) + list(repo.glob("community/flows/*/SKILL.md"))):
    rel = flow.relative_to(repo)
    t = flow.read_text()
    if skill_modes.get(flow.parent.name) is not True:
        errors.append(f"{rel}: a flow must be user-invoked")
    m = re.search(r"^## Units\n(.*?)(?=^## |\Z)", t, re.S | re.M)
    if not m:
        errors.append(f"{rel}: a flow needs a '## Units' list")
        continue
    units = re.findall(r"^- `([a-z0-9-]+)`", m.group(1), re.M)
    if not units:
        errors.append(f"{rel}: '## Units' lists no units")
    for u in units:
        if u not in skill_modes:
            errors.append(f"{rel}: unit {u!r} does not exist")
        elif skill_modes[u]:
            errors.append(f"{rel}: unit {u!r} is user-invoked, so the flow can't call it")

# Slots a flow lists must have a contract in delegate's references/slots.md.
contracts_path = repo / "skills/workflow/delegate/references/slots.md"
contracts = set(re.findall(r"^### ([a-z0-9-]+)$", contracts_path.read_text(), re.M)) if contracts_path.exists() else set()
for flow in sorted(list(repo.glob("skills/flows/*/SKILL.md")) + list(repo.glob("community/flows/*/SKILL.md"))):
    m = re.search(r"^## Slots\n(.*?)(?=^## |\Z)", flow.read_text(), re.S | re.M)
    for s in re.findall(r"^- `([a-z0-9-]+)`", m.group(1), re.M) if m else []:
        if s not in contracts:
            errors.append(f"{flow.relative_to(repo)}: slot {s!r} has no contract in {contracts_path.relative_to(repo)}")

# Manifests: every unit has a unit.yaml, every flow a flow.yaml, each valid against
# its JSON Schema in schemas/, and each flow.yaml agreeing with its SKILL.md.
# Then the safety check: every risky effect a flow can have (its own, plus its
# units') waits on a stop or is covered by the charter; experimental flows may
# not lean on the charter.
import jsonschema
from referencing import Registry, Resource
schemas = {p.name: json.loads(p.read_text()) for p in (repo / "schemas").glob("*.schema.json")}
registry = Registry().with_resources(
    [(s["$id"], Resource.from_contents(s)) for s in schemas.values()]
    + [(name, Resource.from_contents(s)) for name, s in schemas.items()]
)
def validate(path, schema_name):
    data = yaml.safe_load(path.read_text())
    v = jsonschema.Draft202012Validator(schemas[schema_name], registry=registry)
    problems = sorted(v.iter_errors(data), key=lambda e: list(e.path))
    for e in problems:
        where = "/".join(str(x) for x in e.path) or "(root)"
        errors.append(f"{path.relative_to(repo)}: {where}: {e.message}")
    return None if problems else data

RISKY = set(schemas["effects.schema.json"]["x-risky"])
STOP = re.compile(r"\*\*(?:\d+\.\s*)?Stop(?:\s+and\s+ask|:)", re.I)
unit_effects = {}
for skill_md in ALL_SKILLS:
    d = skill_md.parent
    if skill_modes.get(d.name) is True:
        continue
    manifest = d / "unit.yaml"
    if not manifest.exists():
        errors.append(f"{manifest.relative_to(repo)}: missing (every unit declares its effects)")
        continue
    data = validate(manifest, "unit.schema.json")
    if data is not None:
        if data["name"] != d.name:
            errors.append(f"{manifest.relative_to(repo)}: name {data['name']!r} != directory {d.name!r}")
        unit_effects[d.name] = set(data["effects"])

def body_list(text, heading):
    m = re.search(rf"^## {heading}\n(.*?)(?=^## |\Z)", text, re.S | re.M)
    return m.group(1) if m else ""

flows_checked = 0
for flow_md in sorted(list(repo.glob("skills/flows/*/SKILL.md")) + list(repo.glob("community/flows/*/SKILL.md"))):
    d = flow_md.parent
    manifest = d / "flow.yaml"
    rel = manifest.relative_to(repo)
    if not manifest.exists():
        errors.append(f"{rel}: missing (every flow has a manifest)")
        continue
    data = validate(manifest, "flow.schema.json")
    if data is None:
        continue
    flows_checked += 1
    text = flow_md.read_text()
    fm = yaml.safe_load(text.split("---\n", 2)[1])
    if data["name"] != d.name:
        errors.append(f"{rel}: name {data['name']!r} != directory {d.name!r}")
    if data["summary"] != fm.get("summary"):
        errors.append(f"{rel}: summary differs from SKILL.md")
    units_text = body_list(text, "Units")
    split = re.split(r"^\s*throughout\b[^`\n]*:\s*$", units_text, maxsplit=1, flags=re.I | re.M)
    steps = re.findall(r"^- `([a-z0-9-]+)`", split[0], re.M)
    throughout = re.findall(r"^- `([a-z0-9-]+)`", split[1], re.M) if len(split) > 1 else []
    if steps != data["units"]["steps"]:
        errors.append(f"{rel}: units.steps {data['units']['steps']} != SKILL.md {steps}")
    if throughout != data["units"].get("throughout", []):
        errors.append(f"{rel}: units.throughout {data['units'].get('throughout', [])} != SKILL.md {throughout}")
    slots = re.findall(r"^- `([a-z0-9-]+)`", body_list(text, "Slots"), re.M)
    if slots != [s["name"] for s in data.get("slots", [])]:
        errors.append(f"{rel}: slots {[s['name'] for s in data.get('slots', [])]} != SKILL.md {slots}")
    for s in data.get("slots", []):
        for key in ("via", "default"):
            if s.get(key) and s[key] not in skill_modes:
                errors.append(f"{rel}: slot {s['name']!r} {key} {s[key]!r} is not a skill")
    # Only real prose counts as a stop: drop fenced blocks (any indent, 3+ ticks), HTML comments and inline code.
    body = re.sub(r"^[ \t]*(`{3,}|~{3,}).*?^[ \t]*\1", "", text, flags=re.S | re.M)
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)
    body = re.sub(r"`[^`\n]*`", "", body)
    body = re.sub(r"^## Units\n.*?(?=^## |\Z)", "", body, flags=re.S | re.M)
    marks = len(STOP.findall(body))
    if marks != len(data["stops"]):
        errors.append(f"{rel}: {len(data['stops'])} stop(s) declared, SKILL.md marks {marks}")
    for stop in data["stops"]:
        if stop["after"] != "start" and stop["after"] not in steps:
            errors.append(f"{rel}: stop {stop['id']!r} comes after {stop['after']!r}, which is not a step")
    has_failure = bool(re.search(r"^##\s+(?:\d+\.\s*)?When a step fails", text, re.M))
    if "on_failure" in data and data["on_failure"] != has_failure:
        errors.append(f"{rel}: on_failure is {data['on_failure']}, SKILL.md {'has' if has_failure else 'has no'} a 'When a step fails' section")
    effects = set(data["effects"])
    slot_units = [s[k] for s in data.get("slots", []) for k in ("via", "default") if s.get(k)]
    for u in steps + throughout + slot_units:
        effects |= unit_effects.get(u, set())
    covered = {e for stop in data["stops"] for e in stop["guards"]} | set(data["permissions"]["charter"])
    for e in sorted((effects & RISKY) - covered):
        errors.append(f"{rel}: risky effect {e!r} has no stop guarding it and no charter permission")
    # A stop guards a step's effect only if it comes before that step (or at the start).
    position = {"start": -1, **{u: i for i, u in enumerate(steps)}}
    charter = set(data["permissions"]["charter"])
    for i, u in enumerate(steps):
        for e in sorted((unit_effects.get(u, set()) & RISKY) - charter):
            if not any(e in stop["guards"] and position.get(stop["after"], 99) < i for stop in data["stops"]):
                errors.append(f"{rel}: risky effect {e!r} of step {u!r} has no stop before it")
    if data["trust"] == "experimental" and data["permissions"]["charter"]:
        errors.append(f"{rel}: an experimental flow may not lean on the charter; guard {data['permissions']['charter']} with stops")
    if d.parent.parent.name == "community" and data["trust"] == "core":
        errors.append(f"{rel}: a community flow can't be trust: core")

MAX_LINES = 80

for doc in sorted(repo.glob("instructions/*.md")):
    instructions_checked += 1
    rel = doc.relative_to(repo)
    text = doc.read_text()

    if text.startswith("---\n"):
        errors.append(f"{rel}: has YAML frontmatter — instructions are imported verbatim, strip it")
    if not text.lstrip().startswith("# "):
        errors.append(f"{rel}: should open with an H1 heading")
    n = len(text.splitlines())
    if n > MAX_LINES:
        errors.append(f"{rel}: {n} lines — over the {MAX_LINES}-line budget for always-on context")

if not skills_checked and not instructions_checked:
    errors.append("repo contains neither skills nor instructions")

if errors:
    print(f"✗ {len(errors)} problem(s):\n", file=sys.stderr)
    for e in errors:
        print(f"  {e}", file=sys.stderr)
    sys.exit(1)

print(f"✓ {skills_checked} skill(s), {flows_checked} flow manifest(s), {instructions_checked} instruction(s) OK")
PY
