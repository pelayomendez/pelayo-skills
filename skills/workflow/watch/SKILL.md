---
name: watch
description: "Arm a watch on external state the harness can't notify you about (a pipeline for a given commit, a merge request's state, a deploy, a published package version, merges in another repo), with a recorded baseline and a report when it changes. Never starts work. Use when you need to wait for something outside the session, when another skill says to watch or re-arm watches, or when the user asks to keep an eye on a pipeline, MR, release or repo."
---

# Watch

Some state changes where the session can't see it: a pipeline finishing, a merge request merging, a package publishing, another team merging. A **watch** checks that state on a schedule, compares it with a recorded baseline, and reports when it moves. It reports only. Deciding what to do about a change is the caller's job, and a watch never starts work by itself.

## Input

- **What**: the state to follow, as a read command whose output changes when the state does.
- **Keyed on**: the exact thing it is about: a full commit SHA, an MR or PR number, a version, a branch.
- **Done when**: the terminal states that end it, or "until stopped" for a standing watch.
- **A state folder** `<state>`, chosen by the caller (default `.watches/`). The file names inside are fixed.

## Rules

- **Key on the revision, not on "latest".** Ask for the pipeline of a given full SHA, not the newest pipeline. A watch keyed on "latest pipeline" once reported the previous commit's result as this one's.
- **Only a terminal state is a result.** For a pipeline that is `success`, `failed`, `canceled` or `skipped`. `created`, `pending` and `running` are not results, and neither is "no pipeline yet": a merge once went through on "no pipeline running" while the pipeline was still queued.
- **Record the baseline before arming.** Write the first output to `<state>/watch-<name>.json` (or `.txt`). A change is a difference from that file, so a re-armed watch compares against the same thing and reports what moved while it was down.
- **Report on change, and say when nothing changed.** A scheduled check reports every run, even "no change", so silence means the watch is broken, not that the world is quiet. With each change, say what it unblocks if the caller told you.
- **Never start work from a watch.** A tick reports and updates the baseline. Launching a worker, merging or posting is a decision for the session that reads the report.
- **Update the baseline after reporting**, so the same change is not reported twice. The baseline means "seen", never "handled": if the caller must act on each change (review each new MR head, say), it keeps its own ledger of what it handled and updates it only once that work is done.

## How to arm it

Use the cheapest mechanism that works. An idle session still re-sends its whole context on every model wake, so a model tick spent on a mechanical question is paid for in full; a weekend of hourly ticks can cost more than the work they watched.

1. **Script loop, no model.** For anything a command can answer: new commits on a branch, an MR's state, a package version. [`scripts/watch.sh`](scripts/watch.sh) runs a command every N seconds and exits when its output changes; run it as a background command, and its exit wakes the session. Pass `--baseline <state>/watch-<name>.txt` so it compares against the recorded baseline (and writes it if there is none yet); it never overwrites an existing one, that stays your step after reporting. It writes a heartbeat to `$WATCH_HEARTBEAT` (default `.watches/heartbeat`) and exits 1 after three failed runs in a row, so a broken watch wakes you too.
   ```bash
   scripts/watch.sh --baseline .watches/watch-main.txt 300 git ls-remote origin refs/heads/main
   scripts/watch.sh --baseline .watches/watch-mr-42.txt 120 sh -c 'glab mr view 42 -F json | jq -r .state'
   ```
2. **Event wait.** A background command, or the harness's monitor tool, that returns when something reaches a terminal state: the pipeline for a given SHA finishes, a process exits. The main wake signal for work in flight.
   ```bash
   until s=$(glab api "projects/<p>/pipelines?sha=<full sha>" | jq -r '.[0].status // "none"'); \
         case $s in success|failed|canceled|skipped) true;; *) false;; esac; do sleep 60; done; echo "$s"
   ```
3. **Scheduled check (cron).** For a low-frequency check that needs reading, not just comparing: merges in another repo, a release's changelog. Harness crons are **session-only**: they vanish when the session ends, so re-arm them at the start of every session and note when they expire.
4. **Self-paced loop.** A judgement pass for unattended runs, with a fallback wake inside the prompt-cache lifetime (under an hour). The tick prompt stands alone and re-reads the state files.

## Keep a list of armed watches

Every watch you arm gets a row in `<state>/watches.md`, and loses it when it ends:

```markdown
| Watch | Keyed on | Baseline | Mechanism | Re-arm with | Armed |
|---|---|---|---|---|---|
| ci-main | pipeline for <full sha> | watch-ci-main.json | event wait | `<the exact command>` | <date HH:MM> |
```

Take the time from `date`. A fresh session reads this file to re-arm what died with the old one, and the `handoff` unit copies it into the handoff. A watch that isn't in the file will be forgotten.

## Output

On arming: the row added to `watches.md`. On a change: one line per watch (what it was, what it is now, what that unblocks), and the updated baseline.
