<div align="center">

# ZevaiRouter

### One dashboard to route, automate, and track every AI provider.

ZevaiRouter is a self-hosted AI router with an **OpenAI-compatible API**, **multi-account automation**, and **built-in quota tracking** — all wrapped in a sleek **3D dashboard**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## ✨ Features

- **Unified router** — a single OpenAI-compatible endpoint (`/v1`) in front of many AI providers.
- **Multi-account automation** — connect and rotate multiple provider accounts automatically.
- **Quota tracker** — see real-time usage and limits for every provider and account in one place.
- **3D dashboard** — a modern glassmorphism UI with depth, layered soft shadows, and smooth hover motion.
- **Self-hosted** — run it locally or on your own server. Your API keys stay with you.
- **Drop-in compatible** — works instantly with any tool or coding agent that already speaks the OpenAI format.

## 🚀 Quick Start

```bash
# 1. Set up your environment
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Build & run
npm run build
npm run start
```

Once it's running, open:

| Page | URL |
| --- | --- |
| Dashboard | `http://localhost:20128/dashboard` |
| API (OpenAI-compatible) | `http://localhost:20128/v1` |
| Automation | `http://localhost:20128/dashboard/automation` |
| Quota Tracker | `http://localhost:20128/dashboard/quota` |

> For development with hot reload, run `npm run dev` instead.

## 🌐 Public Access / Hosting

By default the app binds to all interfaces (`0.0.0.0`) so it can be reached beyond localhost. For production:

```bash
npm run build
PORT=20128 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://<your-host-or-domain>:20128 npm run start
```

## ⚙️ Configuration (`.env`)

| Variable | Description |
| --- | --- |
| `JWT_SECRET` | Random secret used to sign login sessions (must be changed). |
| `INITIAL_PASSWORD` | Initial password for the first dashboard login. |
| `REQUIRE_API_KEY` | Set `true` to require an API key when calling `/v1`. |
| `AUTH_COOKIE_SECURE` | Set `true` when serving over HTTPS. |
| `BASE_URL` / `NEXT_PUBLIC_BASE_URL` | The base URL where the app is served. |
| `PORT` / `HOSTNAME` | Port (default `20128`) and bind host (default `0.0.0.0`). |

See `.env.example` for the full list.

## 🐳 Docker

```bash
docker build -t zevairouter .
docker run -d -p 20128:20128 \
  -e JWT_SECRET="replace-with-a-random-string" \
  -e INITIAL_PASSWORD="your-password" \
  --name zevairouter zevairouter
```

## 🧱 Tech Stack

- **Next.js 16** + **React 19** (App Router, standalone output)
- **Tailwind CSS v4**
- **Express** for the proxy/API layer
- **SQLite** (`better-sqlite3` optional, `sql.js` fallback) for local storage

## 📄 License

Released under the **MIT** License — see [LICENSE](LICENSE).
