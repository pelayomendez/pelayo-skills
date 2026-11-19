# Flow config: <your app> bugs

Used by `/support <this file>`, `/mr-review <this file>` and `/tune-repo` (which finds the config that lists its repo). Keep it outside the repo (for example `~/.claude/flows/<name>.md`): it is yours, not the project's. Fill what you know; the flow asks once for anything missing and writes the answer here.

## Tracker
- Intake: the epic, label or saved query whose open bugs `/support` works (e.g. epic `BUG-100`, or label `support`).
- Ready labels: `ready-for-agent`.
- Transitions: In Progress, In Review, Done.
- Sprint and points fields, if your tracker uses them (e.g. a custom field id for each).
- Assignee: your account id.
- Skip: tickets assigned to someone else, already in progress, or in the board's Waiting or Blocked sections.
- CLI: how to read and move tickets (e.g. `acli` for Jira; a tracker MCP works too).

## Board
- The status board `tracker-move` keeps: the ticket that holds it (e.g. the intake epic's description), the heading (`## Tracker`), and its sections (In review, In progress, Waiting, Blocked, Next up, Released).

## Repo
- Path `~/code/<app>`, base branch `main`.
- Worktree `~/code/<app>-<KEY>` from `origin/main`, branch `fix/<KEY>`.
- Push and MR: `glab mr create` or `gh pr create`. Merge pinned to the SHA (`--sha <sha>` / `--match-head-commit <sha>`).

## Slots
- Optional: `- implement: <your skill>`, `- review: <your skill>`, `- browser-check: <your skill>`, and for `/tune-repo` `- tests:`, `- architecture:`, `- deps:`, `- bundle:`, `- retro:`. Unset slots use `~/.claude/slots.md`, then the defaults.

## Guard tests
- Tests every review must run (architecture or ratchet tests), e.g. `npm test -- src/architecture.test.ts`.

## Load limits
- One test command at a time; no full type check locally (CI runs it); at most 2 agents in this repo at once.

## App
- Start: `npm run dev -- --port 3000`, from the worktree. Check who holds the port first; never stop someone else's server.
- Open first: `http://localhost:3000/`.
- Test project: the one project the browser check may touch, and what it may do there (e.g. add and save fixtures). Everything else is read-only.
- Browser: your controlled-browser MCP (e.g. chrome-devtools). Never your own browser.

## Release
- How a merge reaches the test environment (e.g. merge to `main` deploys; or a tag), and its URL.

## Tasks
- `<tasks>`: where run folders, reports and the handoff live (e.g. `~/work/<app>-support/`).

## Review (for /mr-review)
- Repos: the repos whose open MRs to go through.
- Mine: your username on the forge. Your MRs are "yours"; everyone else's are "theirs".
- Skip: drafts.
- Comments: the style for review comments, e.g. one or two plain sentences, optional ones prefixed `Nit:`.

## Tune (for /tune-repo)
- Build: the production build the bundle audit runs, e.g. `npm run build`.
- Rules: the files that hold the repo's own design rules, e.g. `CODING_STANDARDS.md`, `docs/adr/`, `.dependency-cruiser.cjs`, the boundary rules in `eslint.config.mjs`, ratchet tests.
