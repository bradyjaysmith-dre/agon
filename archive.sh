#!/usr/bin/env bash
# Milestone snapshot: rsync this project into ~/agon-milestones/<name>/,
# excluding node_modules and other regenerable/ignored paths.
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./archive.sh <milestone-name>"
  exit 1
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$HOME/agon-milestones/$1"

mkdir -p "$DEST_DIR"

rsync -av \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.claude' \
  "$SRC_DIR"/ "$DEST_DIR"/

echo "Snapshot written to $DEST_DIR"
