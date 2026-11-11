# Reading the tracker

Use the CLI that is already installed and logged in; never install one. Read every page. These are starting points: check each against `--help`, because flags change between versions.

## Jira (`acli`)

```bash
acli jira workitem search --jql 'project = ABC AND statusCategory != Done' --fields key,summary,status,assignee,created,updated,parent,issuelinks,labels,duedate,fixVersions,customfield_10016 --paginate --json
acli jira workitem view ABC-123 --json        # description and links of one ticket
```

- Story points are a custom field whose id varies per site; find it on one ticket that has points.
- **Link direction.** Check one known "blocks" pair by hand before trusting `inwardIssue` / `outwardIssue`: some tools invert them.
- Writes, only after an OK and one per command: `acli jira workitem transition`, `acli jira workitem link create`, `acli jira workitem comment create`.

## GitLab (`glab`)

```bash
glab issue list --all --per-page 100 --output json          # repeat with --page until empty
glab api projects/:id/issues/<iid>/links                    # relates_to / blocks / is_blocked_by
```

Blocking links exist only on paid tiers; on Free there are only "relates to" links, so dependencies have to be inferred.

## GitHub (`gh`)

```bash
gh issue list --state open --limit 1000 --json number,title,labels,assignees,createdAt,updatedAt,milestone,body
gh api repos/:owner/:repo/issues/<n>/sub_issues --paginate
gh api repos/:owner/:repo/issues/<n>/dependencies/blocked_by --paginate
```

Native blocked-by / blocking relations are recent; with an older `gh`, read them through `gh api`.

## Linear

No first-party CLI: use the GraphQL API with the user's key (`issues { relations { type relatedIssue { identifier } } }`), only if they already have it set up.

## Code evidence

For "already done": `git log --all --oneline --grep '<KEY>'` in each relevant repo, merged MRs or PRs that mention the key (`glab mr list --merged --search '<KEY>'`, `gh pr list --state merged --search '<KEY>'`), and a direct read of the code the ticket describes.
