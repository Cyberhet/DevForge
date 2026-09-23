#!/usr/bin/env bash
# Vercel's Ignored Build Step (see vercel.json → ignoreCommand).
#
#   exit 0 → skip the build   exit 1 → build
#
# A preview is only worth building when a pull request changes something you can
# see in the browser. Test-only, docs-only, CI-only and script-only PRs — most of
# what the 10 PR Journey produces — get no deployment and no Vercel check.
#
# Production is never skipped: main always deploys.
set -uo pipefail

# Anything that cannot change the rendered site. Everything else builds.
IGNORED='^(scripts/|\.github/|\.claude/|.*\.md$|.*\.test\.ts$|vitest\.config\.ts$|eslint\.config\.mjs$|\.gitignore$|LICENSE$)'

build() { echo "▲ building: $1"; exit 1; }
skip() { echo "▲ skipped: $1"; exit 0; }

[ "${VERCEL_ENV:-}" = "production" ] && build "production deploy"
[ "${VERCEL_GIT_COMMIT_REF:-}" = "main" ] && build "main branch"

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -n "$base" ] || base="HEAD^"

# If the history isn't deep enough to compare, build rather than guess.
files="$(git diff --name-only "$base" HEAD 2>/dev/null)" || build "could not diff against $base"
[ -n "$files" ] || skip "no files changed"

echo "▲ changed files:"
printf '%s\n' "$files" | sed 's/^/    /'

if printf '%s\n' "$files" | grep -qvE "$IGNORED"; then
    build "frontend files changed"
else
    skip "only tests, docs, scripts or CI changed"
fi
