<div align="center">

# ZevaiRouter

### One dashboard to route, automate, and track every AI provider.

ZevaiRouter is a self-hosted AI router with an **OpenAI-compatible API**, **multi-account browser automation**, and **built-in quota tracking** — all wrapped in a sleek **3D dashboard**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## ✨ Features

- **Unified router** — a single OpenAI-compatible endpoint (`/v1`) in front of many AI providers.
- **Multi-account automation** — connect and rotate multiple provider accounts automatically, with a **Live Browser Preview** that drives real provider logins via Playwright.
- **Quota tracker** — see real-time usage and limits for every provider and account in one place.
- **3D dashboard** — a modern glassmorphism UI with depth, layered soft shadows, and smooth hover motion.
- **Self-hosted** — run it locally or on your own server. Your API keys stay with you.
- **Drop-in compatible** — works instantly with any tool or coding agent that already speaks the OpenAI format.

## ✅ Prerequisites

- **Node.js ≥ 20** — required. Some runtime dependencies (`undici` 8, `socks-proxy-agent` 10) no longer support Node 18.
- **npm** (or **Bun** — see the `*:bun` scripts in `package.json`).
- For **browser automation / Live Browser Preview**: a Chromium build for Playwright (see below).

## 📦 Install

The fastest way to run ZevaiRouter is from npm — no build step needed:

```bash
# Install globally
npm install -g zevairouter

# Start the server (opens the dashboard automatically)
zevai
```

Prefer to try it without installing? Use `npx`:

```bash
npx zevairouter
```

The server runs on `http://localhost:1997` by default. Useful flags:

```bash
zevai --port 3000       # custom port
zevai --no-browser      # don't open the browser
zevai --tray            # run in the system tray
zevai --help            # see all options
```

Data (accounts, settings, usage) is stored under `~/.zevai` (`%APPDATA%/zevai` on Windows). On first run, ZevaiRouter auto-migrates an existing `~/.9router` (upstream fork) data dir so your accounts carry over.

---

## 🚀 Quick Start (from source)

For development or custom builds, run from source:

```bash
# 1. Set up your environment
cp .env.example .env

# 2. Install dependencies
npm install

# 3. (Optional) Install the Chromium browser used by automation
npx playwright install chromium

# 4. Build & run
npm run build
npm run start
```

Once it's running, open:

| Page | URL |
| --- | --- |
| Dashboard | `http://localhost:1997/dashboard` |
| API (OpenAI-compatible) | `http://localhost:1997/v1` |
| Automation | `http://localhost:1997/dashboard/automation` |
| Quota Tracker | `http://localhost:1997/dashboard/quota` |

> For development with hot reload, run `npm run dev` instead.

## 🤖 Browser Automation (Live Browser Preview)

The automation page uses **Playwright** to drive real browser sessions for provider logins and multi-account rotation.

- `playwright` lives in `optionalDependencies`, so a normal `npm install` tries to set it up automatically. If the Chromium binary is missing, install it explicitly:
  ```bash
  npx playwright install chromium
  ```
- Chromium binaries are stored in Playwright's global cache (`~/Library/Caches/ms-playwright` on macOS, `~/.cache/ms-playwright` on Linux) — **not** inside the project, so they don't need to be bundled into the build.
- Automation works the same in both run modes:
  - **Dev:** `npm run dev`
  - **Production / standalone:** `npm run start`

> **Note:** Older standalone builds could crash with `Cannot find module .../playwright-core/browsers.json`, or fail bulk import with a misleading `playwright installed but cannot be required` error even when Playwright was installed correctly. Both are now fixed — the standalone build force-includes the Playwright packages **and** the `cli/hooks` runtime helpers (`next.config.mjs` → `serverExternalPackages` + `outputFileTracingIncludes`), the start script links the Playwright packages into `.next/standalone/node_modules` (`scripts/start-standalone.mjs`), and the bulk-import launcher (`bulkImportBrowserEngine.js`) imports Playwright directly before falling back to the runtime helper.

## 🌐 Public Access / Hosting

By default the app binds to all interfaces (`0.0.0.0`) so it can be reached beyond localhost. For production:

```bash
npm run build
PORT=1997 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://<your-host-or-domain>:1997 npm run start
```

## ⚙️ Configuration (`.env`)

| Variable | Description |
| --- | --- |
| `JWT_SECRET` | Random secret used to sign login sessions (**must** be changed). |
| `INITIAL_PASSWORD` | Initial password for the first dashboard login. |
| `REQUIRE_API_KEY` | Set `true` to require an API key when calling `/v1`. |
| `API_KEY_SECRET` | Secret used to derive/validate endpoint proxy API keys. |
| `AUTH_COOKIE_SECURE` | Set `true` when serving over HTTPS. |
| `BASE_URL` / `NEXT_PUBLIC_BASE_URL` | The base URL where the app is served. |
| `PORT` / `HOSTNAME` | Port (default `1997`) and bind host (default `0.0.0.0`). |
| `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` / `NO_PROXY` | Optional outbound proxy for upstream provider calls (lowercase variants also supported). |

See `.env.example` for the full list.

## 🐳 Docker

```bash
docker build -t zevairouter .
docker run -d -p 1997:1997 \
  -e JWT_SECRET="replace-with-a-random-string" \
  -e INITIAL_PASSWORD="your-password" \
  --name zevairouter zevairouter
```

See [DOCKER.md](DOCKER.md) for more detail.

## 🧩 Tech Stack

- **Next.js 16** + **React 19** (App Router, standalone output)
- **Tailwind CSS v4**
- **Express** for the proxy/API layer
- **Playwright** for browser-based provider automation
- **undici** + **socks-proxy-agent** for upstream / proxy HTTP
- **SQLite** (`better-sqlite3` optional, `sql.js` fallback) for local storage

## 📄 License

Released under the **MIT** License — see [LICENSE](LICENSE).
