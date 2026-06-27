#!/usr/bin/env bash
# One-shot migration for installs that cloned the repo BEFORE the ZevaiRouter
# rebrand. Safe to run on a VPS. Idempotent — re-running is harmless.
#
#   bash migrate-to-zevai.sh
#
# What it does:
#   1. Backs up the legacy ~/.9router data dir.
#   2. Force-syncs the git checkout to the rewritten remote history
#      (a plain `git pull` fails because history was squashed).
#   3. Reinstalls deps + rebuilds.
#   4. Restarts via pm2/systemd if detected (port is now 1997).
#   5. On first start the app auto-copies ~/.9router -> ~/.zevai.

set -euo pipefail
cd "$(dirname "$0")"

# Resolve the real home dir even when run under sudo.
HOME_DIR="${HOME}"
if [ -n "${SUDO_USER:-}" ]; then
  HOME_DIR="$(eval echo "~${SUDO_USER}")"
fi

LEGACY_DIR="${HOME_DIR}/.9router"
NEW_DIR="${HOME_DIR}/.zevai"
STAMP="$(date +%Y%m%d-%H%M%S)"

echo "=== [1/6] Backup legacy data (~/.9router) ==="
if [ -d "$LEGACY_DIR" ]; then
  BACKUP="${LEGACY_DIR}-backup-${STAMP}"
  cp -r "$LEGACY_DIR" "$BACKUP"
  echo "Backed up: $BACKUP"
else
  echo "No ~/.9router found — fresh install, nothing to back up."
fi

echo "=== [2/6] Save any local git changes (stash) ==="
if [ -n "$(git status --porcelain)" ]; then
  git stash push -u -m "pre-zevai-migration-${STAMP}" || true
  echo "Local changes stashed (restore later with: git stash list)."
else
  echo "Working tree clean."
fi

echo "=== [3/6] Force-sync to rewritten remote history ==="
# History was squashed on the remote, so `git pull` would diverge/fail.
git fetch origin
git reset --hard origin/main
echo "Now at: $(git log --oneline -1)"

echo "=== [4/6] Install dependencies ==="
npm install

echo "=== [5/6] Build ==="
npm run build

echo "=== [6/6] Restart process (port is now 1997) ==="
if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "zevairouter\|9router"; then
  pm2 restart zevairouter 2>/dev/null || pm2 restart 9router 2>/dev/null || pm2 restart all
  echo "Restarted via pm2."
elif systemctl is-active --quiet zevairouter 2>/dev/null; then
  sudo systemctl restart zevairouter
  echo "Restarted via systemd."
elif systemctl is-active --quiet 9router 2>/dev/null; then
  echo "Detected legacy systemd unit '9router'. Restart it manually after"
  echo "updating its ExecStart/port if needed:"
  echo "  sudo systemctl restart 9router"
else
  echo "WARNING: Could not auto-detect a process manager."
  echo "Restart manually, e.g.:"
  echo "  pm2 restart zevairouter"
  echo "  sudo systemctl restart zevairouter"
  echo "  # or: npm run start"
fi

echo
echo "=== Migration done ==="
echo "On first start the app copies ~/.9router -> ~/.zevai automatically."
echo "Verify accounts carried over:"
echo "  sqlite3 ${NEW_DIR}/db/data.sqlite \"SELECT provider, COUNT(*) FROM providerConnections GROUP BY provider;\""
echo
echo "App now listens on port 1997 (was 20128). Update your reverse proxy /"
echo "firewall / bookmarks accordingly."
