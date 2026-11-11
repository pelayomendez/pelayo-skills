# Mapper briefs

Two sub-agents, dispatched in parallel, both read-only. Fill the `<…>` slots and send each brief verbatim. Example pairing: a web editor that saves a scene document (producer) and a simulator service that loads it (consumer).

## Shared rules (append to both briefs)

```
Read-only: never edit, build, install or run tests. Search with rg (or grep) for the
literal key strings; follow each to the code that reads or writes it.
Every row needs file:line. Write "unknown" rather than guess.
Return only the tables below — no prose summary, no recommendations.
Done when every key in the inventory you were given, and every key you discover on the
way, has a row.
```

## Producer mapper

```
You map how <producer-repo> WRITES the <document name> that <consumer-repo> reads.
Schema: <path or "none">. Focus: <area or "whole document">.
Key inventory from a heuristic scan (leads, incomplete): <paste>

Tables:
1. Entry points — where the document is built and serialised/sent: file:line, function, transport.
2. Keys written — key path (as on the wire, exact case) | type | when written vs omitted
   (always? only when non-default? only when non-empty?) | value when the user never
   touched it | file:line.
3. Variants — every enum value and union/oneof arm emitted: field | literal | file:line.
4. Defaults — every default for a written key: key | value | where defined (code, schema,
   external service, config) | file:line.
5. Id/name keys — values the consumer must match by name or id (model ids, frame names,
   asset ids): key | how generated | file:line.
```

## Consumer mapper

```
You map how <consumer-repo> READS the <document name> that <producer-repo> writes.
Focus: <area or "whole document">.
Key inventory from a heuristic scan (leads, incomplete): <paste>

Tables:
1. Entry points — fetch and parse: file:line, function, parser used.
2. Keys read — key path (exact string literal used) | expected type | behaviour when
   missing / empty / zero / false (default? skip entity? fail?) | file:line.
3. Gates — conditions that skip or short-circuit processing (presence checks, emptiness
   checks, flags): condition | effect | file:line.
4. Variants — every enum/string literal compared against, and how polymorphic lists are
   dispatched (per-element type switch, or one conversion for all?): field | literals
   handled | fallback branch | file:line.
5. Defaults — every fallback value applied when a key is absent: key | value | where
   defined (code, template/prefab, config, external service) | file:line.
6. Lookup tables — hardcoded maps keyed by ids or names from the document: table |
   key source | file:line.
```
