# Reading the tracker

Use the CLI that is already installed and logged in; never install one. Read every page. These are starting points: check each against `--help`, because flags change between versions.

## Jira (`acli`)

```bash
acli jira workitem search --jql 'project = ABC AND statusCategory != Done' --fields key,summary,status,assignee,created,updated,parent,issuelinks,labels,duedate,fixVersions,customfield_10016 --paginate --json
acli jira workitem view ABC-123 --fields '*all' --json   # description, links and comments of one ticket
acli jira workitem link list --key ABC-123 --json        # its links alone
```

- Story points are a custom field whose id varies per site; find it on one ticket that has points.
- **Link direction.** Check one known "blocks" pair by hand before trusting `inwardIssue` / `outwardIssue`: some tools invert them.
- Writes, only after an OK and one per command: `acli jira workitem transition`, `acli jira workitem link create`, `acli jira workitem comment create`.

## GitLab (`glab`)

```bash
glab issue list --per-page 100 --output json               # open only (--all would add closed); repeat with --page until empty
glab issue view <iid> --comments                            # description and comments of one ticket
glab api projects/:id/issues/<iid>/links                    # relates_to / blocks / is_blocked_by
```

Blocking links exist only on paid tiers; on Free there are only "relates to" links, so dependencies have to be inferred.

## GitHub (`gh`)

```bash
gh issue list --state open --limit 1000 --json number,title,labels,assignees,createdAt,updatedAt,milestone,body,comments,closedByPullRequestsReferences
gh api repos/:owner/:repo/issues/<n>/sub_issues --paginate
gh api repos/:owner/:repo/issues/<n>/dependencies/blocked_by --paginate
```

Blocked-by / blocking relations are read through `gh api` as above; `closedByPullRequestsReferences` names the PRs that will close an issue, useful for "already done".

## Linear

No first-party CLI: use the GraphQL API with the user's key (`issues { relations { type relatedIssue { identifier } } }`), only if they already have it set up.

## Code evidence

For "already done": `git log --all --oneline --grep '<KEY>'` in each relevant repo, merged MRs or PRs that mention the key (`glab mr list --merged --search '<KEY>'`, `gh pr list --state merged --search '<KEY>'`), and a direct read of the code the ticket describes.
