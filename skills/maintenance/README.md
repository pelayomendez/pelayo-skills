# Maintenance

Keeping the agent setup and the machine it runs on healthy.

## User-invoked

- **[tidy](./tidy/SKILL.md)** — Regular tune-up of your agent setup: retro on the sessions that went badly, prune memory, audit steering files, skills, permissions and hooks, then log the pass and set the next one. A session-start hook reminds you when a pass is due.

## Model-invoked

- **[reap-procs](./reap-procs/SKILL.md)** — Find what is eating the machine after agent sessions (orphaned test runs, dev servers, automation Chrome, old daemons, stale worktrees), attribute each to its session, and stop only what nobody owns. Its preflight mode says go or wait before several agents start.
