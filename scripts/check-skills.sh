#!/usr/bin/env bash
set -euo pipefail

# Validates every skill in this repo against the conventions in
# .agents/invocation.md. Catches the failure modes that are silent at runtime:
# a description that isn't strict YAML, a name that drifts from its directory,
# a missing agents/openai.yaml, invocation mode out of sync between harnesses,
# and a skill missing from .claude-plugin/plugin.json.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 - "$REPO" <<'PY'
import json, sys, pathlib, yaml

repo = pathlib.Path(sys.argv[1])
errors, checked = [], 0

registered = {
    (repo / p.lstrip("./")).resolve()
    for p in json.loads((repo / ".claude-plugin/plugin.json").read_text())["skills"]
}

for skill_md in sorted(repo.glob("skills/**/SKILL.md")):
    checked += 1
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

    if fm.get("name") != d.name:
        errors.append(f"{rel}: name {fm.get('name')!r} != directory {d.name!r}")
    if not fm.get("description"):
        errors.append(f"{rel}: no description")

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

if errors:
    print(f"✗ {len(errors)} problem(s) across {checked} skill(s):\n", file=sys.stderr)
    for e in errors:
        print(f"  {e}", file=sys.stderr)
    sys.exit(1)

print(f"✓ {checked} skill(s) OK")
PY
