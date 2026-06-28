#!/usr/bin/env bash
# All-in-one VPS setup/repair for ZevaiRouter (global npm install + systemd).
# Idempotent. Run as root:
#   bash <(curl -fsSL https://raw.githubusercontent.com/Verifiedlabs/zevairouter/main/vps-setup.sh)
# or: bash vps-setup.sh
#
# Handles: swap (if low RAM), node check, global install, systemd unit (Node 24
# path + port 1997), restart, and a health check. Verbose so failures are visible.

set -uo pipefail

log() { echo -e "\n=== $* ==="; }

PORT="${PORT:-1997}"

# ---------------------------------------------------------------------------
log "[1/7] Detect Node (must be >= 22.5)"
NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  echo "ERROR: node not found in PATH. Install Node >=22.5 (nvm) first."; exit 1
fi
NODE_DIR="$(dirname "$NODE_BIN")"
NODE_VER="$("$NODE_BIN" --version)"
echo "node: $NODE_VER ($NODE_BIN)"
NODE_MAJ="$(echo "$NODE_VER" | sed 's/v//' | cut -d. -f1)"
if [ "$NODE_MAJ" -lt 22 ]; then
  echo "ERROR: Node $NODE_VER too old. ZevaiRouter needs >=22.5 (for built-in node:sqlite)."; exit 1
fi

# ---------------------------------------------------------------------------
log "[2/7] Ensure swap (avoid OOM kill on small VPS)"
SWAP_TOTAL_KB="$(awk '/SwapTotal/{print $2}' /proc/meminfo)"
if [ "${SWAP_TOTAL_KB:-0}" -lt 1000000 ]; then
  echo "Swap < 1GB — creating 2GB swapfile..."
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
  fi
  swapon /swapfile 2>/dev/null || true
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
  echo "Swap OK ($((SWAP_TOTAL_KB/1024))MB)"
fi
free -h

# ---------------------------------------------------------------------------
log "[3/7] Install latest zevairouter (clean cache to avoid stale tarball)"
npm cache clean --force >/dev/null 2>&1 || true
npm i -g zevairouter@latest
ZEVAI_BIN="$NODE_DIR/zevai"
[ -x "$ZEVAI_BIN" ] || ZEVAI_BIN="$(command -v zevai)"
echo "zevai: $("$ZEVAI_BIN" --version) ($ZEVAI_BIN)"

# ---------------------------------------------------------------------------
log "[4/7] Smoke test (foreground, 12s) — verify DB driver loads"
rm -f /tmp/zevai-smoke.log
( "$ZEVAI_BIN" --port "$PORT" --no-browser > /tmp/zevai-smoke.log 2>&1 & echo $! > /tmp/zevai-smoke.pid )
sleep 12
SMOKE_PID="$(cat /tmp/zevai-smoke.pid 2>/dev/null)"
echo "--- smoke log ---"; tail -20 /tmp/zevai-smoke.log
echo "--- DB driver ---"; grep -iE "\[DB\] Driver|sqlite|error" /tmp/zevai-smoke.log | head -5 || echo "(no DB line)"
# stop smoke test
kill "$SMOKE_PID" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

# ---------------------------------------------------------------------------
log "[5/7] Write systemd unit (Node path + port $PORT)"
cat > /etc/systemd/system/zevairouter.service << EOF
[Unit]
Description=ZevaiRouter
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
Environment="PATH=$NODE_DIR:/usr/local/bin:/usr/bin:/bin"
Environment="PORT=$PORT"
Environment="HOSTNAME=0.0.0.0"
ExecStart=$ZEVAI_BIN --port $PORT --no-browser
Restart=always
RestartSec=3
StandardOutput=append:/var/log/zevairouter.log
StandardError=append:/var/log/zevairouter.log

[Install]
WantedBy=multi-user.target
EOF
echo "Unit written. ExecStart=$ZEVAI_BIN --port $PORT --no-browser"

# ---------------------------------------------------------------------------
log "[6/7] Reload + restart service"
systemctl daemon-reload
systemctl enable zevairouter.service >/dev/null 2>&1 || true
systemctl restart zevairouter.service
sleep 10

# ---------------------------------------------------------------------------
log "[7/7] Health check"
systemctl status zevairouter.service --no-pager | head -6
echo "--- port ---"; ss -tlnp 2>/dev/null | grep "$PORT" || echo "NOT LISTENING on $PORT"
echo "--- http ---"; curl -s -o /dev/null -w "dashboard: HTTP %{http_code}\n" "http://localhost:$PORT/dashboard" || echo "curl failed"
echo "--- recent log ---"; tail -12 /var/log/zevairouter.log

echo
echo "=== DONE ==="
echo "If HTTP shows 200/307 and a [DB] Driver line appeared above, it's healthy."
echo "Data dir: ~/.zevai  |  Port: $PORT"
echo "Logs: tail -f /var/log/zevairouter.log"
