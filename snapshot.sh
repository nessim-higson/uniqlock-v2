#!/bin/bash
# snapshot.sh <name> [commit] — freeze the engine at a commit into
# versions/<name>/. Copies HTML+JS only; imagery/music/reel stay shared
# via the UQ_ASSET_ROOT override, so snapshots cost kilobytes, not 30MB.
set -e
name=$1; commit=${2:-HEAD}
[ -z "$name" ] && { echo "usage: ./snapshot.sh <name> [commit]"; exit 1; }
dir="versions/$name"
rm -rf "$dir"; mkdir -p "$dir"
git archive "$commit" -- comps js index.html css | tar -x -C "$dir"

python3 - "$dir" <<'EOF'
import sys, pathlib
root = pathlib.Path(sys.argv[1])
inject = '<script>window.UQ_ASSET_ROOT = location.origin + location.pathname.replace(/versions\\/.*$/, "");</script>\n'
for f in root.rglob('*.html'):
    s = f.read_text()
    i = s.find('<script type="module"')
    if i >= 0 and 'UQ_ASSET_ROOT' not in s:
        f.write_text(s[:i] + inject + s[i:])
old = "export const ROOT = new URL('..', import.meta.url).href;"
new = "export const ROOT = (typeof window !== 'undefined' && window.UQ_ASSET_ROOT) ? window.UQ_ASSET_ROOT : new URL('..', import.meta.url).href;"
dj = root / 'js' / 'data.js'
if dj.exists():
    dj.write_text(dj.read_text().replace(old, new))
for f in root.rglob('nevverland/index.html'):
    s = f.read_text()
    f.write_text(s.replace("const SRC = '../../assets/reel/nevverland.m4v';",
        "const SRC = (window.UQ_ASSET_ROOT || '../../') + 'assets/reel/nevverland.m4v';"))
EOF

# regenerate the versions index — landmarks (landmark-*) featured up top
{
  echo '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>UNIQLOCK V2 — versions</title><style>body{background:#000;color:#fff;font-family:"Helvetica Neue",Helvetica,sans-serif;padding:12vh 8vw}h1{font-size:14px;letter-spacing:.22em;margin-bottom:1vh;font-weight:700}h2{font-size:12px;letter-spacing:.2em;opacity:.5;margin:6vh 0 1vh;font-weight:700}a.v{display:block;color:#fff;text-decoration:none;font-size:28px;font-weight:700;padding:12px 0;border-top:1px solid #2a2a2a}a.lm{font-size:40px;color:#ffd23e}a.v:hover{color:#ffd23e}a.lm:hover{color:#fff}p{margin-top:4vh;font-size:12px;opacity:.45;line-height:1.7}p a{color:#fff}</style></head><body><h1>UNIQLOCK V2 — VERSIONS</h1>'
  echo '<h2>LANDMARKS</h2>'
  for d in $(ls -d versions/landmark-*/ 2>/dev/null | sort -r); do
    v=$(basename "$d"); echo "<a class=\"v lm\" href=\"$v/comps/\">$v</a>"
  done
  echo '<h2>ITERATIONS</h2>'
  for d in $(ls -d versions/*/ 2>/dev/null | grep -v '/landmark-' | sort -r); do
    v=$(basename "$d"); echo "<a class=\"v\" href=\"$v/comps/\">$v</a>"
  done
  echo '<p>landmarks are the keepers; iterations are every round, newest first. each is the engine frozen as html+js sharing the live asset pool. current work: <a href="../comps/">/comps/</a>.</p></body></html>'
} > versions/index.html
echo "frozen: $dir ($(du -sh "$dir" | cut -f1))"
