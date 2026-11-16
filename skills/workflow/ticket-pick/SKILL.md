---
name: ticket-pick
description: "Take one ready ticket into work: check it is still ready and still free, then move it to In Progress, assign it to the user, and make sure it has a sprint and points. Use when a flow reaches its pick step, when another skill says to pick or start a ticket, or when the user asks to take, start or pick up a ticket."
summary: "Takes a ready ticket into work"
---

# Ticket pick

Starting work on a ticket that someone else already took, or that stopped being ready since it was qualified, wastes a worker run and confuses the team's board. This unit is the last look before work starts, and the tracker edits that say "this is being worked on".

It changes the ticket's status, assignee, sprint and points, nothing else. Moving the item on a status board is `tracker-move`'s job; the caller runs it right after.

## Input

- **Ticket**: its key.
- **Ready labels**: the labels that mark it ready for agent work (for example `ready-for-agent`). From config.
- **In Progress**: the transition name or id.
- **Sprint**: how to find the current sprint (board id, or the field and value), and the field that holds it.
- **Points**: the field that holds the estimate, and the scale (for example Fibonacci).
- **Points value** (optional): the size the user gave after an earlier `needs-you`.
- **Assignee**: the user's account id. Read it from the tracker, never guess it from a name.

## Steps

1. **Read the ticket fresh**: status, assignee, labels, sprint, points, links, and the last comments.
2. **Check it can be picked.** Stop with `blocked <reason>` when any of these holds:
   - It is assigned to someone other than the user.
   - It is already In Progress, In Review or Done.
   - It lost its ready labels, or a comment since then asks a question nobody answered.
   - A link says it is blocked by an open ticket.
3. **Size it if it has no points** and no points value was given. Propose a size with one line of reasoning (the files the fix touches, the tests it needs) and stop with `needs-you <size and reason>`. Never invent an estimate silently.
4. **Write**, in this order, after checking the charter (run the `/charter` skill) for tracker writes in this scope:
   1. assignee: the user
   2. sprint: the current one, if it has none
   3. points, from the points value
   4. transition to In Progress
5. **Read it back** and confirm every field took. Some trackers drop fields silently on a bulk or JSON edit.

## Rules

- **One ticket per call.** A flow picks the next one only after this one is done or dropped.
- **Never take a ticket from someone else**, even an idle one. Report it instead.
- **No comments.** Anything under the user's name goes through the user.

## Output

`done <key>` with the fields as read back, or `blocked <reason>`, or `needs-you <question>`.
