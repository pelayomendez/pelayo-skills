# Working in this repo

This repo holds two kinds of agent guidance: **always-on instructions** (`instructions/`) and **on-demand skills** (`skills/`).

Read [`.agents/invocation.md`](./.agents/invocation.md) before adding or editing either. It defines which shape a piece of guidance should take, the model-invoked / user-invoked split every skill must pick a side of, and the frontmatter rules that are silent when broken — including the one that inverts between the two kinds: skills require frontmatter, instructions must not have it.

Adding something: follow [`CONTRIBUTING.md`](./CONTRIBUTING.md). Always run `npm run check` before committing.

Both kinds are prose, not code. Keep them short and imperative. Instructions are the scarcer resource — they cost context in every session forever — so the bar for adding one is higher than for a skill.
