// Put an HTML file on the macOS pasteboard as rich text (public.html) plus a
// plain-text version (public.utf8-plain-text), so Cmd+V into Teams, Outlook or
// any rich editor keeps bold, links and lists.
//
// Usage:
//   osascript -l JavaScript copyhtml.js post.html
//   osascript -l JavaScript copyhtml.js post.html --pasteboard <name>
//
// --pasteboard writes to a private named pasteboard instead of the general
// one (the clipboard), for testing without touching the user's clipboard.
ObjC.import('AppKit');

function run(argv) {
  let file = null;
  let board = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--pasteboard') board = argv[++i];
    else file = argv[i];
  }
  if (!file || (argv.includes('--pasteboard') && !board)) {
    throw new Error('usage: osascript -l JavaScript copyhtml.js <file.html> [--pasteboard <name>]');
  }

  const html = $.NSString.stringWithContentsOfFileEncodingError(file, $.NSUTF8StringEncoding, null);
  if (html.isNil()) throw new Error('cannot read ' + file);

  const data = html.dataUsingEncoding($.NSUTF8StringEncoding);
  const plain = $.NSAttributedString.alloc.initWithHTMLDocumentAttributes(data, null).string;

  const pb = board ? $.NSPasteboard.pasteboardWithName(board) : $.NSPasteboard.generalPasteboard;
  pb.clearContents;
  const okHtml = pb.setStringForType(html, 'public.html');
  const okText = pb.setStringForType(plain, 'public.utf8-plain-text');
  if (!okHtml || !okText) throw new Error('pasteboard write failed');

  const types = ObjC.deepUnwrap(pb.types).join(', ');
  return 'copied ' + html.length + ' chars to ' + (board || 'the clipboard') + ' [' + types + ']';
}
