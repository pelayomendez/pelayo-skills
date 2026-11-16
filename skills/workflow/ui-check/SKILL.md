---
name: ui-check
description: "Check a change in a real browser: make sure the port, the browser and the test project are free, start the app the way the repo needs it, run a written check in a controlled browser (never the user's own), and report what it saw. Use when a flow reaches its browser check, local or on a test environment, when another skill says to smoke or check a fix in the UI, or when the user asks to see a fix working in the browser."
---

# UI check

Tests pass on code; a bug report is about what a person sees. This unit closes that gap: it runs a written check in a browser the agent controls and reports, with evidence, whether the screen now does what the ticket says.

It reads and clicks; it never changes code.

## Input

- **Check**: the steps and the expected result, written from the ticket's expected vs actual. One file, `check-<KEY>.md`.
- **Where**: `local` (a dev server this unit starts) or a test environment URL (already deployed).
- **App**: how to start it locally (command, port, environment variables), and the URL to open first when the app needs it (some apps must load their root before a deep link works).
- **Test project**: the one project the check may touch, and what it may do there (for example add and save fixtures). Anything else is read-only.
- **Browser**: the controlled browser tools to use. Never the user's own browser.

## Steps

1. **Capacity first.** Before starting anything, check that:
   - **The port is free**: `lsof -iTCP:<port> -sTCP:LISTEN`. If another agent's server holds it, wait and check again; never kill it.
   - **The browser is free**: one agent drives a browser at a time. If it is in use, use another controlled instance or wait.
   - **The machine has room**: no test suite or second dev server of the same app running.
   If any of these stays busy, stop with `blocked <what holds it>`.
2. **Start the app** (local only) from the ticket's worktree, logging to a file next to the check. Wait until it answers on the port.
3. **Run the check** in a fresh context: a subagent, or a headless session with only the browser tools allowed, given `check-<KEY>.md` and nothing else. It:
   - follows the steps, takes a text snapshot at each expected result, and a screenshot only where the result is visual
   - works only in the test project, and puts back anything it created unless the check says to keep it
   - never saves outside the test project, never uploads files the check doesn't name, never prints tokens
   - ends on a blank page (`about:blank`) and closes any page it opened
4. **Stop the app** it started, by the PID listening on the port. Never by process name.
5. **Write the report**, `UI-<KEY>-<where>.md`: each step, what was seen, pass or fail, and the evidence files.

## When it fails

- **The check fails**: report what the screen showed against what was expected. That is a finding, not an error in this unit.
- **The app won't start or the page won't load**: report the log lines and stop. Don't fix the environment by guesswork.
- **Login or a picker blocks the page**: follow what the check says; if it doesn't say, stop with `needs-you <what is asked>`.

## Output

`done pass` or `done fail` with the report's path, or `blocked <reason>`, or `needs-you <question>`.
