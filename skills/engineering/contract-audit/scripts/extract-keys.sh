#!/usr/bin/env bash
set -euo pipefail

# Heuristic inventory of wire-key string literals in a repo — a cheap starting
# point for a contract diff, not a parser. Expect false positives (any quoted
# identifier in a lookup-shaped call) and misses (keys built dynamically, keys
# read as bare properties like obj.key, keys only present in generated code
# you excluded).
#
# Usage: extract-keys.sh [--keys] <repo> [glob]
#   default   one line per hit:  <key><TAB><file>:<line>   sorted by key
#   --keys    unique key names only — feed two of these to `comm` to diff sides
#   glob      restrict files, e.g. '*.cs' or '*.{ts,tsx}'
#
# Shapes matched:
#   ["key"]  ['key']                               index lookups (JS/TS/Python/C++/Lua…)
#   get("key")  getString("key")  opt*("key")  has("key")  TryGetProperty("key")
#   FindField(x, "key")  GetMember(doc, "key")      lookup calls, optional first arg
#   json:"key"  JsonProperty("key")  JsonPropertyName("key")  SerializedName("key")
#   serde(rename = "key")  json_name = "key"        declared wire names
#
# Uses ripgrep when present (respects .gitignore), else grep -r.

keys_only=0
if [[ "${1:-}" == "--keys" ]]; then keys_only=1; shift; fi
repo="${1:?usage: extract-keys.sh [--keys] <repo> [glob]}"
glob="${2:-}"
[[ -d "$repo" ]] || { echo "not a directory: $repo" >&2; exit 2; }

K='[A-Za-z_][A-Za-z0-9_.-]*'
Q="[\"']"
S='[[:space:]]*'
pattern="\\[${S}${Q}${K}${Q}${S}\\]"
pattern+="|(get|Get|opt|has|Has|find|Find|TryGet|contains|Contains)[A-Za-z]*\\(${S}([A-Za-z_][A-Za-z0-9_.>-]*${S},${S})?${Q}${K}${Q}"
pattern+="|json:\"${K}"
pattern+="|(JsonProperty|JsonPropertyName|SerializedName|JsonKey)\\(${S}(name${S}=${S})?\"${K}\""
pattern+="|(rename|json_name)${S}=${S}\"${K}\""

cd "$repo"
if command -v rg >/dev/null 2>&1; then
  args=(--no-heading --with-filename --line-number --only-matching --max-columns 400 --max-columns-preview -e "$pattern")
  [[ -n "$glob" ]] && args+=(-g "$glob")
  hits() { rg "${args[@]}" . || true; }
else
  args=(-rnoE --binary-files=without-match
        --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build
        --exclude-dir=vendor --exclude-dir=Library --exclude-dir=obj --exclude-dir=bin
        --exclude='*.min.js' --exclude='*.map' --exclude='*.lock' --exclude='package-lock.json')
  [[ -n "$glob" ]] && args+=(--include="$glob")
  hits() { grep "${args[@]}" -e "$pattern" . || true; }
fi

# file:line:match  ->  key<TAB>file:line   (key = first quoted token in the match)
hits \
  | sed -E "s#^\./##; s#^([^:]+):([0-9]+):[^\"']*[\"']([^\"',]*).*\$#\\3	\\1:\\2#" \
  | grep -E "^${K}	" \
  | sort -t$'\t' -k1,1 -k2,2V \
  | if (( keys_only )); then cut -f1 | sort -u; else cat; fi
