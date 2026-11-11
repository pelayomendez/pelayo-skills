---
name: verify-claim
description: "Check an agent's claim with a fresh subagent that sees only the claim and its evidence, never the conversation that produced it. Use before presenting a claim as fact (\"this ticket is already done\", \"the worker fixed it\", \"the pipeline is green\", \"A blocks B\"), when another skill says to verify a claim, or when the user asks to double-check something an agent concluded."
---

# Verify a claim

The agent that reached a conclusion is the worst one to check it: it already believes it, and it reads its own evidence the way it meant it. A **fresh** subagent, given only the claim and where to look, has no stake in the answer.

## Input

One or more claims. Each one has three parts:

- **Claim**: one sentence, specific enough to be false. "ABC-12 is done" is too loose. "The export button ABC-12 asks for exists and calls the export API" can be checked.
- **Evidence**: where to look, as pointers rather than conclusions: files, commits, MR or PR links, ticket keys, a command to run.
- **Would refute it**: what the checker would find if the claim were wrong.

## Run it

1. Spawn one fresh subagent per claim, or one per batch of up to five small claims about the same repo. Use the harness's subagent tool, without forking the current context.
2. Pass it the brief below and nothing else. Leave out your reasoning, your confidence and what you hope it finds.
3. It works read-only: it opens files, reads history, runs read commands. It never edits, posts or merges.
4. If no fresh subagent is available, say so and mark every claim **unchecked**. A check in the same context is not this check.

```text
You are checking claims made by another agent. You did not see how they were reached.
For each claim, open the evidence yourself and decide:
  holds      the evidence shows it
  fails      the evidence contradicts it
  partial    part holds; say exactly which part
  unclear    the evidence is missing or not enough to tell
Cite what you opened (file:line, commit, link) for every verdict. Do not trust a commit
message or a ticket status on its own: check what it points to. Read only.

Claims:
1. <claim> | evidence: <pointers> | would refute it: <what>
```

## Output

A table with one row per claim: claim · verdict · reason (one line, with the citation).

The caller uses it like this:
- **holds**: present it as checked.
- **partial**: replace the claim with the narrower one that held.
- **fails** or **unclear**: never present it as fact. Drop it, or turn it into a question for the user.

The verdict is evidence, not a decision. Approving whatever follows from it stays with the user.

This is the Goldfish idea from the [Elephant-Goldfish Model](https://github.com/google/elephant-goldfish-model), applied to claims after the work instead of designs before it.
