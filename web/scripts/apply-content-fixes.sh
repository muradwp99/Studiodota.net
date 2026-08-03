#!/usr/bin/env bash
# Runs the three content-cleanup scripts against whichever database
# DATABASE_URL points at. Dry run by default.
#
#   bash scripts/apply-content-fixes.sh           # show every change, write nothing
#   bash scripts/apply-content-fixes.sh --apply   # write them
#
# Run from the `web/` directory. These edits are content, not schema - no
# migration, nothing to roll back but the values themselves, so read the dry
# run before applying.
set -euo pipefail

APPLY=""
[ "${1:-}" = "--apply" ] && APPLY="--apply"

# Print the target host before touching anything. These scripts have already
# been run against a local database; seeing "127.0.0.1" here means the shell
# picked up the dev .env instead of the production environment, and applying
# would silently do nothing to the live site.
#
# Prisma falls back to ./.env when DATABASE_URL is absent from the shell, so
# resolve it the same way rather than reporting "not set" while the scripts
# quietly connect somewhere else.
TARGET="${DATABASE_URL:-}"
SOURCE="shell"
if [ -z "$TARGET" ] && [ -f .env ]; then
  TARGET="$(sed -nE 's/^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*"?([^"]*)"?[[:space:]]*$/\1/p' .env | tail -1)"
  SOURCE=".env"
fi

if [ -n "$TARGET" ]; then
  HOST="$(printf '%s' "$TARGET" | sed -E 's#.*@([^/?]+).*#\1#')"
  echo "Database: $HOST   (from $SOURCE)"
  case "$HOST" in
    127.0.0.1*|localhost*)
      echo
      echo "WARNING: that is a LOCAL database, not production."
      echo "These fixes have already been applied locally, so you will see 0"
      echo "changes and the live site will be untouched. Point DATABASE_URL at"
      echo "the Hostinger MySQL instance before running with --apply."
      ;;
  esac
else
  echo "Database: could not resolve DATABASE_URL (not in shell, not in ./.env)."
  echo "The scripts below will fail to connect."
fi
echo

for s in rename-at strip-sd-numbering strip-long-dashes sentence-case-kickers; do
  echo "=============================================================="
  echo "  $s ${APPLY:-(dry run)}"
  echo "=============================================================="
  node "scripts/$s.mjs" $APPLY
  echo
done

if [ -z "$APPLY" ]; then
  echo "Nothing was written. Re-run with --apply once the changes above look right."
else
  echo "Applied. Rebuild so the prerendered pages pick the new content up:"
  echo "  npm run build && <restart the app in hPanel>"
  echo
  echo "The pages are prerendered, so content changes do NOT appear until a"
  echo "rebuild - a restart alone will keep serving the old HTML."
fi
