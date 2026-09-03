#!/bin/bash
# Opens a separate Chrome profile with WebMCP testing on.
# A second profile is required: attaching to an already-running Chrome
# ignores --enable-webmcp-testing.

set -euo pipefail
URL="${1:-http://localhost:3000}"
PROFILE="${HOME}/.agentrep-chrome-webmcp"

CHROME=""
for candidate in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
do
  if [ -x "$candidate" ]; then CHROME="$candidate"; break; fi
done

if [ -z "$CHROME" ]; then
  echo "Install Google Chrome, then run this again." >&2
  exit 1
fi

mkdir -p "$PROFILE"
exec "$CHROME" \
  --user-data-dir="$PROFILE" \
  --no-first-run \
  --no-default-browser-check \
  --enable-webmcp-testing \
  --enable-features=WebMCP,WebMCPTesting \
  --origin-trial-disabled-features= \
  "$URL"
