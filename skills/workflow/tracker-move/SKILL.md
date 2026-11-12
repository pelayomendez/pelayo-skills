---
name: tracker-move
description: "Move one item between the sections of a status board kept inside a ticket's description (an epic's Tracker: In review / In progress / Waiting / Blocked / Next up / Released), keeping the rest of the description untouched. Use when a ticket on a board changes state, when another skill says to update the tracker, or when the user asks to move, add or release an item on a tracker."
---

# Tracker move

Some teams keep a status board inside a ticket: an epic's description ends in a **Tracker** with one section per state and one line per item. People read it instead of running a query, so it is only worth having if every state change lands on it. This unit makes that one edit: take an item out of whichever section holds it and put it in another, with a short note.

It changes only the board. Moving the ticket itself (status, assignee) is the caller's job, done with the tracker's own tools.

## Input

- **Board**: the ticket that holds it (e.g. an epic key) and the heading that starts it (e.g. `## Tracker`). The board runs from that heading to the end of the description.
- **Sections**: the section names in order, as the board writes them (e.g. `**In review (MR open)**`). Take them from the board itself, not from memory.
- **Item**: its key.
- **To**: the target section. `remove` takes the item off the board.
- **Line** (optional): the text after the key, e.g. `belt segment labels (1 pt). !587`. Without it, keep the item's current text.
- **Release** (only when moving to a released section): the version and date the item shipped in.

A flow passes these from its config; the unit has no defaults for a particular team.

## Rules

- **Read the description fresh, right before writing.** Others edit the same ticket. A write built from an earlier read silently undoes their change.
- **Touch only the board.** Everything above the board heading goes back exactly as read. Never reformat it, and never rewrap or reorder other items' lines.
- **One line per item.** Remove the item from every section it appears in, then add it once to the target. An item listed twice on a board is a bug in the board.
- **Keep empty sections visible.** A section left with no items gets the board's placeholder line (e.g. `* _(none)_`); a section that receives an item loses its placeholder.
- **Group releases.** In a released section, items sit under a sub-heading per release (`**Released (<env> <version>, <date>, verified on <env>)**`). Add to the matching group, or start a new one above the older groups.
- **Stamp the board.** If the heading carries a date (`## Tracker (updated <date>)`), set it to today. Take the date from `date`, never from memory.
- **Write in a format that round-trips.** If the description holds anything markdown would lose (images, mentions, panels), write it back in the format it was read in (HTML), or the edit drops them.
- **Check after writing.** Re-read the description and confirm the item appears once, in the target section, and that the text above the board is unchanged. If it doesn't, report it. Don't retry blindly over someone else's concurrent edit.
- **Editing a shared ticket is publishing.** Check the charter (run the `/charter` skill). A standing grant to keep this board current covers it; without one, show the edit and ask.

## Output

The board lines before and after the move, the release group if one was used, and whether the after-write check passed.
