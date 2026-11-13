---
name: qualify
description: "Decide, bug by bug, whether a reported bug is ready for an agent to fix: research it in the code and the logs (and the browser when the report doesn't settle a UI bug), check the report has what a worker needs, then label it for agent work or name the missing question. Never fixes. Use when a support flow reaches its qualify step, when the user asks which bugs can be automated, auto-fixed or handed to an agent, or asks to research, check or ready a bug list."
---

# Qualify

A fix worker can only be as good as the ticket it gets. A sweep that picks up "every bug labelled for agents" is safe only if something decided, with evidence, which bugs earn the label. This unit is that decision. It reads each open bug from the intake, researches it, and ends in one of three places: **ready** (labelled), **needs you** (a question you can answer), or **waiting** (a question only someone else can answer).

It never writes code and never opens a branch.

## Input

- **Items**: the open bugs to look at, as the intake hands them over (for example the children of a bug epic). Bugs from anywhere else are the intake's job, not this unit's.
- **Ready labels**: the labels a ready bug gets (for example `auto-fixable`, `ready-for-agent`). From config, no defaults.
- **Skip rules**: from config. Usually: already labelled, assigned to someone other than the user, in progress or in review, or listed as waiting on a decision or blocked on the board.
- **Repo and logs**: where the code lives, and how to query the logs (an error tracker, a log search).
- **Check project** (optional): an environment and project where a browser reproduction may run, and what it may do there.

## Per bug

1. **Read the ticket fresh.** Take the summary, the description, the comments and the links.
2. **Research.**
   - Find the code path the report describes, and say what in it would produce the behaviour.
   - Look for the error in the logs when the report mentions one.
   - Reproduce in the controlled browser only when the bug is a UI bug and neither the report nor the code settles whether it is real. Run one browser at a time, and end on a blank page.
3. **Check readiness.** A bug is ready only when all of these hold:
   - It is real: the code, the logs or a reproduction shows it. A plausible story is not enough.
   - It can be reproduced from the ticket: steps, environment, version.
   - Expected and actual behaviour are stated, so a reviewer can tell the fix is right.
   - The fix needs no product, design or other-team decision. "What should happen" has one answer.
   - The scope fits one MR in one repo.
4. **End in one place.**
   - **ready**: add the ready labels. Check the charter first (run the `/charter` skill). A grant for this flow covers it; without one, ask.
   - **needs you**: one question, short, with what the research found. Collect these for the grilling step below; don't label yet.
   - **waiting**: the decision belongs to someone else (a designer, a backend team, the reporter). Name who and what. Don't label, and don't ask the user to guess.

## Grilling the gaps

After the pass, take the **needs you** bugs one at a time. Ask one question per message, with a recommended answer and why. When the answers settle a bug:

1. Draft a rewrite of the ticket: steps, environment, expected vs actual, scope, plus what the research found. Leave the reporter's original text quoted below it.
2. Show the exact text. It goes out under the user's name, so publish it only after an explicit yes for that ticket.
3. Then add the ready labels.

## Rules

- **Evidence or no label.** Every ready bug carries the evidence that makes it ready: a code location, a log line or a reproduction.
- **Don't fix while qualifying.** Once you can see the fix, write it down as one line in the report, then stop. The fix worker gets it as a hint, not as an instruction.
- **Labels only, no comments.** The pass posts nothing. Rewrites go through the grilling step with the user's OK.
- **Leave others' tickets as they are.** Don't change status, assignee or sprint here; that's `ticket-pick`'s job.
- **Idempotent.** A second pass skips what the first one labelled, and re-asks only the questions still open.

## Output

A report with three groups:
- **ready**: key, one line of evidence, the fix hint.
- **needs you**: key and the question.
- **waiting**: key, who, and what is being waited for.

Then a line saying which labels were added, and whether any were blocked by the charter.
