---
name: release-announce
description: "Turn a release (tag, MR/PR URL, changelog entry or notes) into a Microsoft Teams announcement: headline, short body as paste-safe HTML and Markdown, and a rendered banner image. Use when the user wants to announce a release, write a release post for Teams, or share what shipped."
allowed-tools: Read, Write, Glob, Bash(glab:*), Bash(rtk proxy glab:*), Bash(gh:*), Bash(git log:*), Bash(git tag:*), Bash(git show:*), Bash(mkdir:*), Bash(osascript -l JavaScript:*), mcp__chrome-devtools__new_page, mcp__chrome-devtools__resize_page, mcp__chrome-devtools__emulate, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__close_page, mcp__chrome-devtools-2__new_page, mcp__chrome-devtools-2__resize_page, mcp__chrome-devtools-2__emulate, mcp__chrome-devtools-2__take_screenshot, mcp__chrome-devtools-2__close_page
---

# Release announce

Turn one release into a Teams channel Announcement the user posts themselves. You produce files and paste steps; you never post, send or upload anything.

Paths below are relative to this skill's directory. Teams limits and caveats are in [references/teams.md](references/teams.md); the writing pattern is in [references/post-pattern.md](references/post-pattern.md).

## 1. Gather facts

Read the release from its source and keep only what the source states:

- **GitLab**: `glab release view <tag>`, `glab mr view <iid> -F json` (title, description, merged state), and the `CHANGELOG.md` entry for the version. Prefix with `rtk proxy` when RTK is installed. Add `-R <group>/<project>` outside a checkout.
- **GitHub**: `gh release view <tag>`, `gh pr view <n> --json title,body,url,mergedAt`, and the changelog.
- **Pasted notes or a changelog entry**: use them as given.

Collect: product name, version, what the user can now do that they could not before, how to get it, and the links (MR/PR, changelog, docs). Every feature, number and date in the post comes from this list. When a fact is missing (no docs link, no install step), leave it out or ask; the step is done when each claim you will write has a source.

## 2. Draft and confirm

Write the headline and body per [references/post-pattern.md](references/post-pattern.md): headline of 7 words or fewer, body of 125 words or fewer, every sentence under 25 words, addressed to "you", user-visible outcomes only.

The post goes out under the user's name. If an `in-my-own-words` skill is installed, run the draft through it. Otherwise write plainly.

Show the headline and body as plain text and ask for an OK. Apply edits until the user approves the exact text. Produce no files before that.

## 3. Write the files

Output folder: the one the user names, else `~/Documents/Announcements/<YYYY-MM-DD>-<slug>/` (slug from the headline, lowercase, hyphens). Create it.

- `post.html`: the approved body as an HTML fragment, using only `h2, b, i, a, ul, ol, li, blockquote, code, p, br`. No `style` or `class` attributes, no colours, no tables, no images. Under 80 KB. The headline is typed into Teams separately, so leave it out of the body.
- `post.md`: the same body in Markdown, for chats or anywhere HTML paste fails.

## 4. Render the banner

Render `assets/banner.html` in the controlled browser. Parameters go in the query string: `title` (product), `version`, `subtitle` (one short line, optional), `accent` (hex without `#`), `layout` (`banner` default, or `inline`).

1. `new_page` with `file://<absolute path to assets/banner.html>?title=…&version=…&subtitle=…&accent=…` (URL-encode values).
2. `resize_page` to 1800×500, then `emulate` with `viewport: "1800x500x2"` for a sharp 2× image.
3. `take_screenshot` with `filePath: <output folder>/banner.png`.
4. Read the PNG and look at it: text not clipped, centre left calm (Teams draws the headline there). Fix the parameters and re-render if not.
5. Offer the 16:9 inline image for chats or the post body: same URL plus `&layout=inline`, viewport `1600x900x2`, saved as `inline.png`. Render it only if the user wants it.
6. `close_page`.

Use the `chrome-devtools` tools; if they fail to start, use `chrome-devtools-2`. If neither works, tell the user, skip the banner, and continue. Render only in these controlled browsers, never in the user's own browser session.

## 5. Hand over

List the files with absolute paths, then give the paste steps:

1. In the Teams **channel**, start a new post and choose post type **Announcement**.
2. Type the headline into the headline field.
3. Use the background image option to upload `banner.png`.
4. In a terminal: `osascript -l JavaScript <skill dir>/scripts/copyhtml.js <output folder>/post.html`
5. Click into the body and press Cmd+V.
6. Check the preview: bold, links and lists intact. Post.

Announcements exist only in channels. For a chat, paste the body (step 4–5) and attach `inline.png` instead. If the paste loses formatting, use the RTF fallback in [references/teams.md](references/teams.md) or paste `post.md`.
