/**
 * Unit tests for src/lib/db/repos/quotaCacheRepo.js
 *
 * Uses the real SQLite driver against a temp DATA_DIR so the schema auto-syncs
 * the quotaCache table. Verifies save/read/rank helpers used by smart routing.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Point the app data dir at a throwaway location BEFORE any db module loads.
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "zevai-quota-test-"));

describe("quotaCacheRepo", () => {
  let repo;
  beforeAll(async () => {
    repo = await import("../../src/lib/db/repos/quotaCacheRepo.js");
  });

  it("saves and reads a snapshot", async () => {
    await repo.saveQuotaSnapshot("conn-1", "antigravity", {
      plan: "Free",
      quotas: { "claude-sonnet-4-6": { remainingPercentage: 80, used: 200, total: 1000 } },
    });
    const snap = await repo.getQuotaSnapshot("conn-1");
    expect(snap).toBeTruthy();
    expect(snap.provider).toBe("antigravity");
    expect(snap.usage.quotas["claude-sonnet-4-6"].remainingPercentage).toBe(80);
    expect(typeof snap.fetchedAt).toBe("string");
  });

  it("upserts (overwrites) an existing snapshot", async () => {
    await repo.saveQuotaSnapshot("conn-1", "antigravity", {
      quotas: { "claude-sonnet-4-6": { remainingPercentage: 40 } },
    });
    const snap = await repo.getQuotaSnapshot("conn-1");
    expect(snap.usage.quotas["claude-sonnet-4-6"].remainingPercentage).toBe(40);
  });

  it("getCachedRemainingPercent returns per-model remaining", async () => {
    const pct = await repo.getCachedRemainingPercent("conn-1", "claude-sonnet-4-6");
    expect(pct).toBe(40);
  });

  it("getCachedRemainingPercent returns null for unknown model/conn", async () => {
    expect(await repo.getCachedRemainingPercent("conn-1", "no-such-model")).toBe(null);
    expect(await repo.getCachedRemainingPercent("no-conn", "x")).toBe(null);
  });

  it("getAllQuotaSnapshots filters by provider", async () => {
    await repo.saveQuotaSnapshot("conn-2", "kiro", { quotas: {} });
    const ag = await repo.getAllQuotaSnapshots("antigravity");
    const all = await repo.getAllQuotaSnapshots();
    expect(ag.every((s) => s.provider === "antigravity")).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("deletes a snapshot", async () => {
    await repo.deleteQuotaSnapshot("conn-2");
    expect(await repo.getQuotaSnapshot("conn-2")).toBe(null);
  });
});
