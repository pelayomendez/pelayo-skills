# Post pattern

The headline and body follow GitLab's release-note rules, which are built for exactly this job: a short, reader-first description of one release.

## Headline

- 7 words or fewer. It goes into the Teams Announcement headline field, not the body.
- Name the outcome, not the version bump: "Share boards with a single link", not "Orbit 2.4 released".

## Body

- 125 words or fewer in total. Count them.
- Every sentence under 25 words.
- Second person, present tense, conversational: talk to "you"; leave "we" out.
- Open with the change in value: "Previously you had to X. Now you can Y." Several distinct capabilities become a bulleted list, one outcome per bullet.
- One action line: how to get it ("Update to 2.4 from the app menu", "Reload the page", "Run `npm i orbit@2.4`"). A brief activation step is fine.
- Then the links, with text that names the destination: the MR or PR, the changelog, the docs.
- Leave out implementation detail: no syntax, variable names, API parameters, file names, refactors or internal ticket numbers.
- Only facts from the gathered source. A number, date or feature you cannot point to in the source stays out.

## Shape

```text
Headline: Share boards with a single link

Previously you exported a board to share it. Now you can send one link, and
anyone in your workspace opens the live board.

- Links respect the board's existing permissions.
- Viewers see changes as you make them.

Update to Orbit 2.4 from the app menu.

Merge request · Changelog · Docs
```

## HTML mapping

| Markdown        | HTML                          |
| --------------- | ----------------------------- |
| paragraph       | `<p>`                         |
| **bold**        | `<b>`                         |
| _italic_        | `<i>`                         |
| `code`          | `<code>`                      |
| bullet list     | `<ul><li>`                    |
| numbered list   | `<ol><li>`                    |
| quote           | `<blockquote>`                |
| link            | `<a href="…">`                |
| section heading | `<h2>` (rarely needed)        |
| line break      | `<br>`                        |

Join the links on one line in a `<p>`, separated by ` · `.

## Source

- GitLab documentation, release notes guidelines: https://handbook.gitlab.com/handbook/marketing/blog/release-posts/ (now redirects to https://docs.gitlab.com/development/documentation/release_notes/). Titles of seven words or fewer, bodies of 125 words or fewer, sentences under 25 words, second person, "In previous versions … you couldn't … Now you can …", no implementation details, descriptive link text.
