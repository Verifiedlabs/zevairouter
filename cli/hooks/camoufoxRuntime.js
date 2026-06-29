// Ensure camoufox-js (optional stealth Firefox engine) is installed AND its
// browser binary is downloaded. The package is in optionalDependencies, so
// `npm install -g zevairouter` may legitimately ship without it (e.g. when npm
// skipped optional install on a constrained network). When the user picks
// Camoufox in the bulk-import modal we install lazily \u2014 same shape as the
// sqlite/playwright runtime helpers \u2014 instead of failing the worker.
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { runNpmInstall, getRuntimeDir, getRuntimeNodeModules } = require("./sqliteRuntime");

const CAMOUFOX_PACKAGE = "camoufox-js";
const CAMOUFOX_VERSION = "^0.11.0";

// This helper is reached through webpack-bundled server code, which rewrites
// bare `require(...)` into its own module registry — so `require("camoufox-js")`
// throws MODULE_NOT_FOUND even though the package is on disk. __non_webpack_require__
// is left untouched by webpack and resolves to Node's real require at runtime;
// outside webpack (plain CLI) it's undefined, so we fall back to require.
const nodeRequire =
  typeof __non_webpack_require__ === "function" ? __non_webpack_require__ : require;

let cachedReady = null;

function tryRequireCamoufox() {
  try {
    return nodeRequire(CAMOUFOX_PACKAGE);
  } catch {}
  try {
    const runtimeNm = getRuntimeNodeModules();
    const candidate = path.join(runtimeNm, CAMOUFOX_PACKAGE);
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return nodeRequire(candidate);
    }
  } catch {}
  return null;
}

function findCamoufoxCli() {
  const candidates = [];
  // camoufox-js ships its CLI entry as dist/__main__.js (there is no cli.js).
  const rel = ["dist", "__main__.js"];
  try {
    const pkgJson = nodeRequire.resolve(`${CAMOUFOX_PACKAGE}/package.json`);
    candidates.push(path.join(path.dirname(pkgJson), ...rel));
  } catch {}
  try {
    candidates.push(path.join(getRuntimeNodeModules(), CAMOUFOX_PACKAGE, ...rel));
  } catch {}
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function getCamoufoxBinaryDir() {
  const homeDir = os.homedir();
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || path.join(homeDir, "AppData", "Local"), "camoufox");
  }
  if (process.platform === "darwin") {
    return path.join(homeDir, "Library", "Caches", "camoufox");
  }
  return path.join(homeDir, ".cache", "camoufox");
}

function isCamoufoxBinaryAvailable() {
  const dir = getCamoufoxBinaryDir();
  if (!fs.existsSync(dir)) return false;
  const candidates = [
    path.join(dir, "camoufox.exe"),
    path.join(dir, "camoufox"),
    path.join(dir, "camoufox", "camoufox.exe"),
    path.join(dir, "camoufox", "camoufox"),
    // macOS ships the browser as an .app bundle, not a bare binary.
    path.join(dir, "Camoufox.app", "Contents", "MacOS", "camoufox"),
  ];
  return candidates.some((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  });
}

function ensureCamoufoxPackage({ silent = false } = {}) {
  const mod = tryRequireCamoufox();
  if (mod) return { ok: true, module: mod };

  if (!silent) console.log("\u23f3 Installing camoufox-js (first run, ~few MB)...");
  const installRes = runNpmInstall({
    cwd: getRuntimeDir(),
    pkgs: [`${CAMOUFOX_PACKAGE}@${CAMOUFOX_VERSION}`],
    extraArgs: ["--no-save"],
    timeout: 300_000,
  });

  if (!installRes.ok) {
    return {
      ok: false,
      reason: `npm install ${CAMOUFOX_PACKAGE} failed: ${installRes.stderr.split("\n").pop().slice(0, 200)}`,
    };
  }

  const installed = tryRequireCamoufox();
  if (!installed) {
    return { ok: false, reason: "camoufox-js installed but cannot be required" };
  }
  return { ok: true, module: installed };
}

function fetchCamoufoxBinary({ silent = false, timeout = 600_000 } = {}) {
  const cliPath = findCamoufoxCli();
  if (!cliPath) {
    return { ok: false, reason: "camoufox-js cli script not found after install" };
  }
  if (!silent) console.log("\u23f3 Downloading Camoufox browser binary (first run, ~150MB)...");
  const res = spawnSync(process.execPath, [cliPath, "fetch"], {
    stdio: silent ? ["ignore", "pipe", "pipe"] : "inherit",
    timeout,
    encoding: "utf8",
  });
  if (res.status === 0) {
    if (!silent) console.log("\u2705 Camoufox browser ready");
    return { ok: true };
  }
  const stderr = String(res.stderr || "");
  let reason = "unknown error";
  if (/ENOTFOUND|ETIMEDOUT|getaddrinfo/i.test(stderr)) reason = "no internet connection";
  else if (/EACCES|EPERM/i.test(stderr)) reason = "permission denied";
  else if (/ENOSPC/i.test(stderr)) reason = "not enough disk space";
  else if (stderr.trim()) reason = stderr.trim().split(/\r?\n/).pop().slice(0, 200);
  return { ok: false, reason };
}

function ensureCamoufoxRuntime({ silent = false } = {}) {
  if (cachedReady === true) return { ok: true };

  const pkg = ensureCamoufoxPackage({ silent });
  if (!pkg.ok) {
    cachedReady = false;
    const error = new Error(
      `Camoufox engine not available. ${pkg.reason}. ` +
      `Install manually with "npm install -g camoufox-js && npx camoufox-js fetch", then retry. ` +
      `You can also switch back to the Chromium engine in the bulk-import modal.`
    );
    error.code = "CAMOUFOX_PACKAGE_MISSING";
    return { ok: false, error };
  }

  if (!isCamoufoxBinaryAvailable()) {
    const fetched = fetchCamoufoxBinary({ silent });
    if (!fetched.ok) {
      cachedReady = false;
      const error = new Error(
        `Camoufox browser binary not downloaded. ${fetched.reason}. ` +
        `Run "npx camoufox-js fetch" manually, then retry. ` +
        `You can also switch back to the Chromium engine in the bulk-import modal.`
      );
      error.code = "CAMOUFOX_BINARY_MISSING";
      return { ok: false, error };
    }
  }

  cachedReady = true;
  return { ok: true, module: pkg.module };
}

function loadCamoufoxModule() {
  return tryRequireCamoufox();
}

function resetCache() {
  cachedReady = null;
}

module.exports = {
  ensureCamoufoxRuntime,
  loadCamoufoxModule,
  isCamoufoxBinaryAvailable,
  resetCache,
};
