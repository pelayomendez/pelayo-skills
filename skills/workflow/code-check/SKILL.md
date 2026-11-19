---
name: code-check
description: "Check the code side of a set of tickets, because the tracker lags behind the code: merged and open MRs per ticket, whether the merged work is released and deployed, stale or conflicting MRs, and open MRs with no ticket. Writes one file other skills read. Read only. Use when a flow reaches its code check, before pruning, ordering or picking tickets, or when the user asks which tickets are already done in code, in review, or waiting on a deploy."
summary: "Checks what the code says about tickets"
---

# Code check

A ticket says "To Do" while its fix is merged, deployed and forgotten; another says "In Progress" while its MR has sat in conflict for a month. This unit reads the code side for a set of tickets and writes what it finds, so pruning, ordering and picking work from the code's truth, not the tracker's. It changes nothing.

## Input

- **Tickets**: a snapshot (`tickets.json` from `snapshot-backlog`), or a list of keys.
- **Repos** to look in: from the flow config, else from the tickets (repo labels, linked MRs, paths in the description).
- **Environments**, if the config names them: where each one's deployed version can be read (a deploy manifest, a release tag, a version endpoint).
- **Run folder**: where `code.json` goes: next to the snapshot, or the caller's run folder when there is no snapshot.

## Steps

1. **MRs per ticket.** For each repo, list MRs (open and merged in the last 90 days) whose title, branch or description names a ticket key (`glab mr list --search '<KEY>'`, `gh pr list --search '<KEY>'`, both states). Record per MR: state, author, head SHA, last activity, merge conflicts, pipeline.
2. **Released and deployed.** For each merged MR, find whether a release contains its merge commit (`git tag --contains <sha>`, or the changelog), and which environments run that release (the deploy manifest's version, or the environment's version endpoint). Merged but not released, or released but not deployed, is work the tracker usually doesn't show.
3. **Flag**, per ticket, with the evidence. Give each ticket **one** flag, the first that applies in this order:
   - **done in code**: a merged MR covers what the ticket asks (open the diff; a mention of the key alone is not enough) and it runs in the environment the ticket needs;
   - **waiting on a deploy**: merged and covers the ask, but not yet in that environment;
   - **stale MR**: an open MR with no activity for more than 14 days, or with conflicts or a failing pipeline;
   - **in review**: an open MR that is moving, with its author;
   - **nothing yet**: no MR found.
4. **MRs with no ticket**: open MRs in the repos that name no key. List them; they are work the tracker can't see. **Shared MRs**: one MR that names several keys; list it with its keys, since those tickets ship together.
5. **Write** `code.json` (below) and stop.

## Output

`code.json` next to the snapshot:

```json
{
  "checked_at": "2026-11-19T21:00:00Z",
  "repos": ["group/app"],
  "tickets": {
    "ABC-7": {
      "flag": "done in code",
      "mrs": [{ "repo": "group/app", "iid": 42, "state": "merged", "merge_sha": "a1b2c3d", "released_in": "v1.4.0", "deployed": { "dev": "v1.4.0", "prod": "v1.3.2" } }],
      "evidence": "MR !42 adds the CSV export the ticket asks for (src/export/csv.ts:40); in v1.4.0, on dev, not on prod"
    }
  },
  "untracked_mrs": [{ "repo": "group/app", "iid": 51, "title": "…", "author": "…" }],
  "shared_mrs": [{ "repo": "group/app", "iid": 44, "keys": ["ABC-9", "ABC-11"] }]
}
```

Who reads it: `prune-backlog` (done in code is evidence for closing), `order-backlog` (in review and stale MRs, shared MRs as bundles), `/support` (skip a bug someone is already fixing, or one already fixed).

## Never

Comment, approve, rebase, merge, close or edit an MR or a ticket. Read only.
