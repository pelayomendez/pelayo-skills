# Guards: nevers as checks

A line in the ledger can be forgotten; a hook that exits 2 can't. These two PreToolUse(Bash) hooks block the nevers agents break most, in the main session and in every subagent. Both need `jq`.

| Script | Blocks | Allows |
|---|---|---|
| `guards/block-process-kill.sh` | `pkill`, `killall` in command position; `kill` fed by `lsof -t` without `-sTCP:LISTEN` (that also kills the port's clients, such as the browser) | `kill <pid>`, `lsof -tiTCP:<port> -sTCP:LISTEN \| xargs kill`, the words in prose (`git commit -m "fix: never pkill"`) |
| `guards/block-temp-rm.sh` | `rm -r`/`-f` and `find … -delete` aimed at `$TMPDIR`, `/tmp`, `/var/folders`, `$HOME` or `/` themselves | deleting a path inside them (`rm -rf "$TMPDIR/mine"`) |

They are opt-in: copy them somewhere stable and add them to `settings.json`:

```json
"hooks": {
  "PreToolUse": [
    { "matcher": "Bash", "hooks": [
      { "type": "command", "command": "/path/to/block-process-kill.sh" },
      { "type": "command", "command": "/path/to/block-temp-rm.sh" }
    ] }
  ]
}
```

They match patterns, so they block the common forms (with a path, `env`/`command`/`nice` prefixes, `VAR=x` prefixes, `--recursive --force`), not every possible one: a command hidden in a longer quoted `sh -c "…"` string, `cd /tmp && rm -rf *`, or a second unfiltered `lsof` kill on a line that also has `-sTCP:LISTEN` get through. Quoted text that itself starts with the command (`sh -c "rm -rf /tmp"`) counts as a command, so the same words in an `echo` are blocked too. Without `jq` the guards do nothing. Write the matching never into the ledger as well.
