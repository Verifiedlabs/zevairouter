#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "=== [1/5] Git Pull ==="
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "Already up to date ($LOCAL)"
  echo "=== Done. No restart needed. ==="
  exit 0
fi

git pull origin main
echo "Updated: $LOCAL → $REMOTE"

echo "=== [2/5] Check package-lock changes ==="
if git diff --name-only "$LOCAL" "$REMOTE" | grep -q "package-lock.json\|package.json"; then
  echo "Dependencies changed, running npm install..."
  npm install
else
  echo "No dependency changes, skipping npm install."
fi

echo "=== [3/5] Build ==="
npm run build

echo "=== [4/5] Restart Process ==="
# Try pm2 first, then systemd, then fallback to manual notice
if command -v pm2 &>/dev/null && pm2 list 2>/dev/null | grep -q "zevairouter\|9router"; then
  pm2 restart zevairouter 2>/dev/null || pm2 restart 9router 2>/dev/null || pm2 restart all
  echo "Restarted via pm2."
elif systemctl is-active --quiet zevairouter 2>/dev/null; then
  sudo systemctl restart zevairouter
  echo "Restarted via systemd."
else
  echo "WARNING: Could not auto-detect process manager."
  echo "Please restart manually:"
  echo "  pm2 restart zevairouter   # if using pm2"
  echo "  sudo systemctl restart zevairouter  # if using systemd"
  echo "  # or kill the old process and run: npm run start"
fi

echo "=== [5/5] Done ==="
echo "ZevaiRouter updated to $(git log --oneline -1)"
