---
name: snapshot-backlog
description: "Read a slice of a tracker backlog (project, epic, label or saved query) into one local snapshot file that other skills work from: tickets, links with direction, sizes, dates and recent comments. Read only. Use when a skill needs a backlog snapshot, or when the user asks to pull, export or look at the open tickets of a scope."
---

# Snapshot a backlog

Reads the open tickets in a scope **once** and writes them to a file, so pruning, ordering and any later pass all work from the same picture without querying the tracker again.

## Rules

- Read only. This skill never writes to the tracker.
- Open tickets only, and every page of results.
- Use the tracker CLI that is already installed and logged in ([references/trackers.md](references/trackers.md)). Never install one.

## Steps

1. **Scope.** Take it from the argument: a project, an epic, a label or a saved query. Raw reports that were never triaged belong to a triage skill (if you have one), not here.
2. **Fetch.** For each ticket, collect: key, title, type, status, assignee, created, updated, parent or epic, links with direction, labels, size (points or estimate), due date or release, the description, and the last five comments. Also record the status of every linked ticket and parent, even when they are outside the scope or closed: pruning and ordering need to know whether a blocker or an epic is done.
3. **Check one link by hand.** Take a known "blocks" pair and confirm its direction. Some CLIs report links inverted. Record the pair you checked.
4. **Write** `backlog-<scope-slug>-<YYYY-MM-DD>/tickets.json` in the workspace, or where the user asks. The slug is the scope in lower case with every run of other characters turned into `-`, cut to 40 characters (`epic ABC-100` becomes `epic-abc-100`). Use the shape below.
5. **Say how many** tickets are in scope. Above about 150, suggest splitting by epic or component before anything else runs on it.

```json
{
  "scope": "epic ABC-100",
  "tracker": "jira",
  "fetched": "2026-11-11T10:00",
  "link_direction_checked": "ABC-7 blocks ABC-9",
  "tickets": [
    {
      "key": "ABC-7", "title": "…", "type": "Story", "status": "To Do",
      "assignee": null, "created": "2026-03-02", "updated": "2026-05-10",
      "parent": "ABC-100", "parent_status": "In Progress", "labels": [], "size": 3, "due": null, "release": null,
      "links": [{ "type": "blocks", "key": "ABC-9", "status": "To Do" }],
      "description": "…",
      "comments": [{ "author": "…", "date": "2026-05-10", "text": "…" }]
    }
  ]
}
```

Link `type` is one of `blocks`, `blocked_by`, `duplicates`, `duplicated_by` or `relates`, always seen from the ticket that holds it.

The other backlog units, when run on their own, use the newest run folder for the scope.
