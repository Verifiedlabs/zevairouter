# v1.0.27 (2026-07-01)

Fix Camoufox engine "installed but cannot be required".

## Fixes
- **Camoufox bulk-import engine now loads reliably.** The lazily-installed `camoufox-js` package lives in `~/.zevai/runtime/node_modules`, but the standalone server's bundled require couldn't resolve it (MODULE_NOT_FOUND from a non-project cwd), even though the package and its browser binary were present. We now load it with a runtime-anchored `createRequire`, which uses real Node resolution and works from any working directory.

# v1.0.26 (2026-07-01)

Removed the Skills page.

## Changes
- Removed the "Skills" sidebar entry and page (the copy-a-URL agent-skills feature). Context Injection (soul.md/agent.md upload + inject) covers custom agent behavior now.

# v1.0.25 (2026-07-01)

Automation: typed accounts no longer lost when switching tabs.

## Fixes
- **Bulk automation keeps your typed accounts.** Switching between automation provider tabs (or anything that remounts the modal) used to wipe the accounts textarea, forcing you to paste them again. The accounts draft is now saved per-provider and restored automatically; it's cleared once the job actually starts.

# v1.0.24 (2026-07-01)

Fix Antigravity "Invalid JSON response" (all accounts erroring).

## Fixes
- **Antigravity chat now works again.** The anti-ban header scrub set `Accept-Encoding: gzip, deflate, br` manually. Under Node's fetch (undici), a manually-set Accept-Encoding disables automatic response decompression, so the upstream reply came back as raw gzip/brotli bytes and failed to parse ("Invalid JSON response from antigravity"). We no longer set Accept-Encoding — undici negotiates it and decompresses automatically. Verified with live chats across multiple accounts.
- Note: accounts whose Google tier requires a user-defined GCP project (`userDefinedCloudaicompanionProject`) still can't auto-onboard a project id — that's a Google account-type requirement, not a router bug. Free/auto-onboard accounts work.

# v1.0.23 (2026-07-01)

AutoClaw balance display + branding cleanup.

## Fixes
- **AutoClaw balance now shows real consumption**: the wallet API only returns the current balance (not spend), so points appeared static. It now tracks a baseline (peak balance seen) and shows `used = baseline − remaining`, so the Usage bar reflects points actually consumed. Note: balance refreshes on the ~5-minute quota sweep, not instantly after each chat.
- **Branding**: replaced remaining visible "9Router" text in the CLI Tools cards (MITM server, Antigravity, Droid, jcode, OpenCode) and MITM UI with ZevaiRouter. Functional identifiers (config profile keys, model ids like `custom:9Router-*`, cert names, data-dir name) are intentionally left unchanged to avoid breaking existing user setups.

# v1.0.22 (2026-07-01)

Bulk upload for Context Injection.

## Features
- **Upload .md** button on the Context Inject page: multi-select many markdown files at once (e.g. a whole agent framework like SUPERAGENT). Each file becomes a context entry — the file name is the entry name, its content the injected text.
- Uploaded files are **disabled by default** so importing dozens of files doesn't inflate token cost on every request. Enable only the core files (SOUL, AGENTS, USER, registry) you actually want injected.

# v1.0.21 (2026-07-01)

Fix AutoClaw balance / "Unable to read balance".

## Fixes
- **AutoClaw balance & test connection** now authenticate the wallet endpoint with `authorization: Bearer <token>`. The wallet/asset API rejects the raw token (returns "user not logged in"), even though chat works with the raw `X-Authorization` token. Points now display and test connection passes for healthy accounts.

# v1.0.20 (2026-07-01)

New feature: Context Injection — inject your own system-prompt files into every request.

## Features
- **Context Injection** (Sidebar → Context Inject): create your own context files (soul.md, agent.md, rules…) that get prepended to the system prompt of every chat request routed through ZevaiRouter, across all providers and formats (OpenAI / Claude / Gemini / Antigravity).
  - Multi-file: add unlimited files, each with an enable toggle and injection order.
  - Global on/off switch; shows how much text is added per request.
  - Injection happens at one central point after format translation (mirrors the Caveman injector), so it works for every provider uniformly.

# v1.0.19 (2026-07-01)

AutoClaw connection fixes + branding cleanup.

## Fixes
- **AutoClaw test connection**: the connection test now probes AutoClaw's wallet endpoint with its signed headers instead of the generic Bearer flow, fixing the misleading `[500] parse response failed` error on healthy accounts.
- **AutoClaw token handling**: access tokens are now stored and sent without a leading `Bearer ` prefix, so chat (`X-Authorization`) always receives the raw JWT.
- **Branding**: replaced remaining "9Router" / `9router` references in the OIDC settings (issuer/client ID placeholders), login, sidebar, MITM, skills, and endpoint UI with ZevaiRouter / the `zevai` CLI command.

# v1.0.18 (2026-07-01)

Automation page now shows real provider logos.

## Fixes
- The Automation page provider tabs and header used generic Material Symbols icons. They now render each provider's actual logo (Kiro, CodeBuddy, Qoder, Antigravity, AutoClaw), falling back to the icon only if the logo is missing.

# v1.0.17 (2026-07-01)

AutoClaw provider logo.

## Fixes
- Added the official AutoClaw logo so the provider no longer shows a plain text placeholder in provider lists and topology.

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
