# v1.0.16 (2026-07-01)

New provider: AutoClaw (autoclaw.z.ai) — bulk auto-register + chat + points balance.

## Features
- **AutoClaw provider** (OpenAI-compatible GLM/DeepSeek proxy by Z.ai). Adds an Automation panel with bulk Google-OAuth auto-registration, chat routing, and per-account points balance.
  - Bulk register: paste `gmail:password` lines and the worker automates Google login, intercepts AutoClaw's tokens from the auth response (localStorage fallback), fetches the account's points, and saves the connection. Reuses the shared Google automation + auto-detect concurrency.
  - Chat: models `openrouter_glm-5.2` (GLM-5.2), `zai_glm-5-turbo` (GLM-5-Turbo), `zai_auto` (DeepSeek-V4-Pro), routed via `autoclaw/<model>`. Uses AutoClaw's signed headers (`X-Authorization`, `X-Request-Model`, MD5 `X-Auth-Sign`) and its own token refresh.
  - Usage: remaining points shown on the Usage/quota page.

# v1.0.15 (2026-07-01)

Bulk import now auto-tunes worker count to the host — no more CPU pegged at 100% on small VPS.

## Improvements
- **Bulk import "Auto-detect" concurrency is now ON by default**: worker count is derived from the server's CPU/RAM (clamped to 1–8) instead of always starting at 4. On a small VPS (e.g. 2 vCPU / 2 GB) this settles at 1–2 workers, avoiding the CPU spike to 100% that happened when 4 headless browsers launched at once. You can still uncheck it and set the worker count manually.

# v1.0.14 (2026-07-01)

Branding cleanup — replaced leftover "9Router" references in user-facing surfaces with ZevaiRouter.

## Fixes
- Usage → Provider Topology: the center node now reads **ZevaiRouter** instead of "9Router".
- Changelog content cleaned of stale upstream branding and old Docker image names.

# v1.0.13 (2026-07-01)

Smart routing by remaining quota — requests now prefer accounts with the most quota left.

## Features
- **Smart routing by remaining quota**: the executor can route each request to the account with the highest remaining quota, spreading load and reducing the chance of hitting per-account limits.
- Server-side quota cache: remaining-quota reads are cached server-side to avoid repeated upstream lookups on every request, cutting latency and upstream call volume.

# v1.0.12 (2026-07-01)

Antigravity anti-ban hardening, quota reading fix, and proxy rotation.

## Improvements
- **Anti-ban hardening** for the Antigravity provider to reduce the risk of account flags.
- **Quota reading fix**: remaining-quota values now parse correctly from upstream responses.
- **Proxy rotation**: outbound requests can rotate through configured proxies to distribute traffic.
