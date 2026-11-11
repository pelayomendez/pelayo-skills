---
name: contract-audit
description: "Audit the data contract between a producer repo and a consumer repo — a JSON, protobuf or REST document one side writes and the other reads — for key drift, ignored variants, conflicting defaults and absence semantics. Use when the user wants to find contract gaps between two repos, asks why a value set in one system doesn't arrive in another, or wants guards against default drift."
---

# Contract audit

`contract-audit <producer-repo> <consumer-repo> [--schema <path>] [--focus <area>]`

The contract is the set of **wire keys** and **enum literals** each side reads or writes. Anchor every search on those strings with plain text search (`rg`, `grep`); semantic indexing blurs exactly the spelling differences you are hunting.

## 1. Inventory

Run `scripts/extract-keys.sh --keys <repo> [glob]` on both repos and `comm` the two lists: a cheap, heuristic first view of keys present on one side only. It misses keys read as bare properties or built dynamically, so treat it as a lead list, never as the verdict.

Note whether the producer has a generated schema (protobuf, OpenAPI, JSON Schema, zod; `--schema` points at it). If it does, the producer side is typed and the risk concentrates on the consumer's hand-written string lookups and on defaults. `--focus` narrows both mappers to one area of the document.

Done when you have both key lists, the one-sided keys, and a yes/no on a producer schema.

## 2. Map both sides in parallel

Dispatch two read-only sub-agents at once, one per repo, using the briefs in [references/mapper-briefs.md](references/mapper-briefs.md). Pass each the inventory and `--focus`.

Done when both return their tables with `file:line` on every row.

## 3. Diff

Do this pass yourself — it needs both tables in one context. Join the tables on key path and classify every mismatch into exactly one class:

- **key-drift** — written but never read, read but never written, or renamed / case-mismatched (`snake_case` vs `camelCase`).
- **variant-drift** — the producer emits enum values or union / oneof arms the consumer ignores or collapses. Classic shape: the consumer converts every element of a polymorphic list as one variant, silently dropping the other variants' fields.
- **default-drift** — one default defined in two places with different values. Sharpest under sparse / override-only contracts, where the producer omits untouched values and the consumer falls back to *its own* default (metadata says `enabled: true`, the consumer's template says off; rate 30 on one side, 60 on the other).
- **absence-semantics** — zero / empty / false means "unset" on one side and is meaningful on the other. proto3 JSON omits zero values; a consumer treating 0 as unset, or skipping an entity when a flag is false-or-absent, lands here.
- **join-key-drift** — lookups keyed by names or ids that match only by convention: frame names, model ids mapped through a hardcoded table.
- **misattributed-gate** — a belief from the discussion or docs ("X only happens if the list is non-empty") that the code does not implement. Test every such claim against code.

Each finding carries: class, severity (high / medium / low by user-visible effect), a one-line effect as a user would see it, evidence `file:line` on **both** sides, and `verified: yes|no`.

Done when every row of both tables is either matched or carries a finding.

## 4. Sources of truth

Defaults often live in neither repo: an asset or metadata service, config files, templates, prefabs, seed data. For every defaulted key, answer *where does this default actually come from at runtime?* and list every source that defines it. A key with two or more sources that disagree is a default-drift finding.

Done when every defaulted key has its full list of sources.

## 5. Verify

Read the code yourself for every high-severity finding and at least the top five overall. Mapper tables are leads; a finding is `verified: yes` only after you have read both `file:line` sites. Downgrade or drop what does not hold.

## 6. Report

Write to the path the user chose, default `./contract-audit-<producer>-<consumer>-<YYYY-MM-DD>.md`, with these sections:

1. **Summary** — the contract in one paragraph, finding counts per class, the top three risks.
2. **Gaps** — table: class, severity, effect, producer `file:line`, consumer `file:line`, verified.
3. **Sources of truth** — table: key, every source with its value, which one wins at runtime.
4. **Guards** — per class, the deterministic check that would catch it next time. Default-drift and key-drift belong in a script run in CI against shared fixtures (a golden document both repos load and assert on), not in repeated model reads; this skill's `extract-keys.sh` is a starting point for such a check.
