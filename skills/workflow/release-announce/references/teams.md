# Teams caveats

What is known, and what is not, about pasting a post into Microsoft Teams.

## Announcements

- Announcement is a post type in **channels** only; chats (group or one-on-one) do not have it. In a chat, paste the body and attach the 16:9 inline image.
- Picking the type depends on the channel layout: the Announcement icon in the compose toolbar, the **Post type** button next to Post, or **Actions and apps** in the threads layout.
- The headline has its own field. The background is either a colour scheme or **Upload an image**.
- Uploading your own image needs no extra licence. AI-generated (Designer) backgrounds are a Teams Premium feature; Microsoft's announcement page does not describe them, so do not rely on them.

## Banner size

Microsoft publishes no banner size or safe area. About 1800×500 (rendered at 2×) is the working choice: Teams crops the image to a wide strip and draws the headline over its middle, which is why the template keeps text at the edges and the centre calm. Check the preview before posting; if the crop cuts the title, re-render with a shorter title or subtitle.

## Pasted HTML

Microsoft does not document which pasted HTML survives. In practice bold, italic, links, lists, quotes and inline code survive; headings mostly do; tables are flaky; CSS, colours and classes are stripped or mangled; data-URI images are dropped or bloat the post. Hence the tag allowlist: `h2, b, i, a, ul, ol, li, blockquote, code, p, br`.

Teams' own Markdown autoformat (typing `**bold**` in the compose box) is a fallback for short posts; it is not applied to pasted text.

## Size limit

A channel post is limited to approximately 100 KB, counting text, links, @-mentions and reactions (base64 images excluded). For chats Microsoft recommends staying within 80 KB. Keep `post.html` under 80 KB; a 125-word post is a few KB.

## Clipboard fallback (RTF)

If the JXA script fails, put the HTML on the clipboard as RTF with the built-in `textutil`:

```bash
textutil -stdin -format html -convert rtf -stdout < post.html | pbcopy -Prefer rtf
```

RTF loses nothing in the tag allowlist except `<code>` styling. Pasting `post.md` as plain text is the last resort.

## Sources

- Send an announcement to a channel in Microsoft Teams: https://support.microsoft.com/en-us/teams/teams-channels/send-an-announcement-to-a-channel-in-microsoft-teams
- Use Markdown formatting in Microsoft Teams: https://support.microsoft.com/en-us/teams/chat/use-markdown-formatting-in-microsoft-teams
- Limits and specifications for Microsoft Teams (post size): https://learn.microsoft.com/en-us/microsoftteams/limits-specifications-teams
