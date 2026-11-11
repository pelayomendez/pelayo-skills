# Ledger format

One Markdown file, three sections, one grant per line:

```
- <action> · <scope> · since <YYYY-MM-DD>[ · until <YYYY-MM-DD or event>][ · revoked <YYYY-MM-DD>] — "<the user's sentence>"
```

- **action**: a verb phrase the agent can match against what it is about to do ("merge reviewed PRs, sha-pinned", "post comments on the tracker").
- **scope**: `everywhere`, a repo (`owner/repo`), a set (`work repos`, `personal repos`), a run (`night run 2026-11-12`), an epic or a project. Define any set at the top of the file.
- **until**: optional. Run-scoped grants always carry one.
- the quote: the sentence the user said. A line without one was not granted; it is a default the user accepted when the file was created.

## Default ledger

Offer this when no file exists, and let the user edit it before saving. It is deliberately conservative: everything outside the task's own reading, editing and testing starts at ask first.

```markdown
# Charter

Sets: (define your own, e.g. `work repos: org/a, org/b`)

## Alone
- read, edit and test inside the current task's repo · everywhere · since <today>
- run subagents and headless workers in their own worktrees · everywhere · since <today>
- commit on a feature branch · everywhere · since <today>

## Ask first
- anything published under my name: comments, posts, MR/PR descriptions, messages · everywhere · since <today>
- push · everywhere · since <today>
- merge, release or deploy · everywhere · since <today>
- delete or stop anything I didn't ask you to start · everywhere · since <today>
- touch another team's system or shared docs · everywhere · since <today>

## Never
- force-push, or rewrite pushed history · everywhere · since <today>
- install software (brew, global npm/pip) · everywhere · since <today>
- stop another session's processes, or kill by pattern (pkill/killall) · everywhere · since <today>
- delete temp or home roots · everywhere · since <today>
- start new work from a watch tick · everywhere · since <today>
```
