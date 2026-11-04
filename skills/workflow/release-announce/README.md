# release-announce

Turns a release into a Microsoft Teams channel Announcement that you post yourself. `SKILL.md` is the agent's instructions; this file is for people.

## What you get

In `~/Documents/Announcements/<date>-<slug>/` (or a folder you name):

- `post.html`: the body, using only tags that survive a Teams paste.
- `post.md`: the same body in Markdown, the fallback.
- `banner.png`: an Announcement background, about 1800×500, text at the edges so the Teams headline sits on a calm centre.
- `inline.png` (on request): a 16:9 image for chats, which have no Announcement type.

Nothing is posted or sent. You see and approve the text before any file is written.

## How it works

1. **Facts** come from the source: `glab` for GitLab releases, MRs and changelogs, `gh` for GitHub, or notes you paste. Nothing is invented.
2. **Text** follows GitLab's release-note rules: headline of 7 words or fewer, body of 125 words or fewer, sentences under 25 words, "Previously … now you can …", one action line, links. If you have an `in-my-own-words` skill installed, the draft goes through it.
3. **Banner** is rendered from `assets/banner.html` (title, version, subtitle, accent colour as URL parameters; system fonts, inline SVG, no network) in a controlled Chrome via the chrome-devtools MCP. Without one, the banner is skipped.
4. **Clipboard**: `osascript -l JavaScript scripts/copyhtml.js post.html` puts the HTML and a plain-text version on the macOS clipboard, so Cmd+V in Teams keeps formatting. `--pasteboard <name>` writes to a private pasteboard instead, for testing.

## Requirements

macOS for the clipboard script; `glab` or `gh` for repo sources; the chrome-devtools MCP for the banner.

## Sources

- [GitLab release notes guidelines](https://docs.gitlab.com/development/documentation/release_notes/) (formerly the release-posts handbook page)
- [Send an announcement to a channel in Teams](https://support.microsoft.com/en-us/teams/teams-channels/send-an-announcement-to-a-channel-in-microsoft-teams)
- [Markdown formatting in Teams](https://support.microsoft.com/en-us/teams/chat/use-markdown-formatting-in-microsoft-teams)
- [Teams limits and specifications](https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams)
