# Working in this repo

This repo holds agent skills. Read [`.agents/invocation.md`](./.agents/invocation.md) before adding or editing one — it defines the model-invoked / user-invoked split that every skill must pick a side of, and the frontmatter rules that are silent when broken.

Adding a skill: follow [`CONTRIBUTING.md`](./CONTRIBUTING.md). Always run `./scripts/check-skills.sh` before committing.

Skills are prose, not code. Keep them short and imperative. A skill that needs a long preamble to justify itself is usually two skills, or none.
