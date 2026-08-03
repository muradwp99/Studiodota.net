#!/usr/bin/env bash
# Runs the four content-cleanup scripts. Dry run unless --apply is passed.
#
#   bash scripts/apply-content-fixes.sh                              # local db, dry run
#   bash scripts/apply-content-fixes.sh --env-file .env.prod         # live db, dry run
#   bash scripts/apply-content-fixes.sh --env-file .env.prod --apply # live db, write
#
# Run from the `web/` directory.
#
# --env-file keeps production credentials out of the shell history and out of
# the process list: node reads the file itself, so the connection string is
# never an argument. Any .env* file is already gitignored.
#
# These edits are content, not schema. Nothing to migrate, nothing to roll back
# but the values - so read the dry run before applying.
set -euo pipefail

APPLY=""
ENV_FILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY="--apply"; shift ;;
    --env-file) ENV_FILE="${2:?--env-file needs a path}"; shift 2 ;;
    --env-file=*) ENV_FILE="${1#*=}"; shift ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

NODE_ARGS=()
if [ -n "$ENV_FILE" ]; then
  [ -f "$ENV_FILE" ] || { echo "no such file: $ENV_FILE" >&2; exit 1; }
  NODE_ARGS+=("--env-file=$ENV_FILE")
fi

# Report the target host before touching anything. Prisma falls back to ./.env
# when DATABASE_URL is absent, so resolve it the same way - saying "not set"
# while Prisma quietly connects elsewhere is how these get applied to the wrong
# database and written off as broken.
RESOLVED_FROM="${ENV_FILE:-}"
if [ -n "$ENV_FILE" ]; then
  URL="$(sed -nE 's/^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*"?([^"]*)"?[[:space:]]*$/\1/p' "$ENV_FILE" | tail -1)"
elif [ -n "${DATABASE_URL:-}" ]; then
  URL="$DATABASE_URL"; RESOLVED_FROM="shell"
elif [ -f .env ]; then
  URL="$(sed -nE 's/^[[:space:]]*DATABASE_URL[[:space:]]*=[[:space:]]*"?([^"]*)"?[[:space:]]*$/\1/p' .env | tail -1)"; RESOLVED_FROM=".env"
else
  URL=""
fi

if [ -z "$URL" ]; then
  echo "Could not find DATABASE_URL. The scripts below will fail to connect." >&2
  exit 1
fi

# Host only - never echo the credentials themselves.
HOST="$(printf '%s' "$URL" | sed -E 's#^[^@]*@##; s#[/?].*$##')"
echo "Database: $HOST   (from $RESOLVED_FROM)"

case "$HOST" in
  127.0.0.1*|localhost*)
    echo
    echo "NOTE: this is the LOCAL database. These fixes were already applied"
    echo "here, so expect 0 changes. To reach the live site, pass:"
    echo "  --env-file .env.prod"
    if [ -n "$APPLY" ]; then
      echo
      echo "Refusing to --apply against localhost; nothing to do." >&2
      exit 1
    fi
    ;;
esac
echo

for s in rename-at strip-sd-numbering strip-long-dashes sentence-case-kickers; do
  echo "=============================================================="
  echo "  $s ${APPLY:-(dry run)}"
  echo "=============================================================="
  node "${NODE_ARGS[@]+"${NODE_ARGS[@]}"}" "scripts/$s.mjs" $APPLY
  echo
done

if [ -z "$APPLY" ]; then
  echo "Nothing was written. Re-run with --apply once the above looks right."
else
  echo "Applied to $HOST."
  echo
  echo "The site's pages are prerendered, so this content will NOT appear until"
  echo "the app is rebuilt. Trigger a redeploy in hPanel."
fi
