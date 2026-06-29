#!/usr/bin/env node

// Postinstall: warm-up runtime deps into ~/.zevai/runtime so the first
// `zevai` start doesn't need network. Failure here is non-fatal —
// cli.js will retry at runtime if anything is missing.
const { ensureSqliteRuntime } = require("./sqliteRuntime");
const { ensureTrayRuntime } = require("./trayRuntime");
const { ensurePlaywrightRuntime } = require("./playwrightRuntime");

try {
  ensureSqliteRuntime({ silent: false });
  console.log("[zevai] runtime SQLite deps ready");
} catch (e) {
  console.warn(`[zevai] runtime warm-up skipped: ${e.message}`);
}

try {
  ensureTrayRuntime({ silent: false });
} catch (e) {
  console.warn(`[zevai] tray runtime skipped: ${e.message}`);
}

try {
  const pw = ensurePlaywrightRuntime({ silent: false });
  if (pw.ok) console.log("[zevai] Playwright + Chromium ready");
  else console.warn(`[zevai] Playwright setup skipped: ${pw.error?.message || "unknown"}`);
} catch (e) {
  console.warn(`[zevai] Playwright setup skipped: ${e.message}`);
}

process.exit(0);
