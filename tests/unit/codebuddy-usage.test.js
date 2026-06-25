import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../open-sse/utils/proxyFetch.js", () => ({
  proxyAwareFetch: vi.fn(),
}));

import { proxyAwareFetch } from "../../open-sse/utils/proxyFetch.js";
import { getUsageForProvider } from "../../open-sse/services/usage.js";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CodeBuddy usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches quota with IDE access token and saved identity headers", async () => {
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({
      data: {
        Response: {
          Data: {
            Accounts: [
              {
                PackageCode: "TCACA_code_001_PqouKr6QWV",
                CycleCapacitySize: 100,
                CycleCapacityRemain: 80,
                CapacityUsed: 20,
              },
            ],
          },
        },
      },
    }));

    const usage = await getUsageForProvider({
      provider: "codebuddy",
      accessToken: "ide-access-token",
      providerSpecificData: {
        uid: "uid-1",
        enterpriseId: "enterprise-1",
      },
    });

    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
    expect(proxyAwareFetch.mock.calls[0][0]).toBe("https://www.codebuddy.ai/v2/billing/meter/get-user-resource");
    expect(proxyAwareFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer ide-access-token");
    expect(proxyAwareFetch.mock.calls[0][1].headers["X-User-Id"]).toBe("uid-1");
    expect(proxyAwareFetch.mock.calls[0][1].headers["X-Enterprise-Id"]).toBe("enterprise-1");
    expect(JSON.parse(proxyAwareFetch.mock.calls[0][1].body).PackageCodes).toBeUndefined();
    expect(usage.authMode).toBe("oauth");
    expect(usage.quotas["Monthly Credits"]).toMatchObject({
      used: 20,
      total: 100,
      remaining: 80,
    });
  });

  it("falls back to chat-key message when a generated chat key is rejected by the quota endpoint", async () => {
    // uid lookup (401) then quota fetch (401) — both rejected
    proxyAwareFetch.mockResolvedValue(jsonResponse({ message: "unauthorized" }, 401));

    const usage = await getUsageForProvider({
      provider: "codebuddy",
      apiKey: "cb-key",
      providerSpecificData: {
        authMode: "generated-api-key",
      },
    });

    expect(proxyAwareFetch).toHaveBeenCalled();
    expect(usage.plan).toBe("CodeBuddy");
    expect(usage.message).toContain("chat key active");
    expect(usage.message).toContain("Upstream quota is unavailable");
    expect(usage.message).toContain("ZevaiRouter Usage");
    expect(usage.trackingMode).toBe("local-router");
    expect(usage.quotas).toEqual({});
  });

  it("fetches upstream quota with a generated chat key when the endpoint accepts it", async () => {
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({
      data: { accounts: [{ uid: "uid-1", enterpriseId: "ent-1", lastLogin: 1 }] },
    }));
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({
      data: {
        Response: {
          Data: {
            Accounts: [
              {
                PackageCode: "TCACA_code_006_DbXS0lrypC",
                CycleCapacitySize: 250,
                CycleCapacityRemain: 162,
                CapacityUsed: 88,
              },
            ],
          },
        },
      },
    }));

    const usage = await getUsageForProvider({
      provider: "codebuddy",
      apiKey: "ck_generated",
      providerSpecificData: {
        authMode: "generated-api-key",
      },
    });

    expect(usage.authMode).toBe("api-key");
    expect(usage.quotas["Gift Credits"]).toMatchObject({
      used: 88,
      total: 250,
      remaining: 162,
    });
  });

  it("does not replay quota with a saved cookie for generated-key connections", async () => {
    // cookie is ignored; quota is fetched via the API key
    proxyAwareFetch.mockResolvedValue(jsonResponse({ message: "unauthorized" }, 401));

    const usage = await getUsageForProvider({
      provider: "codebuddy",
      apiKey: "cb-key",
      providerSpecificData: {
        webCookie: "session=abc",
        authMode: "generated-api-key",
      },
    });

    expect(usage.authMode).toBe("generated-api-key");
    expect(usage.trackingMode).toBe("local-router");
  });

  it("does not fall back to cookie when the IDE OAuth token is rejected", async () => {
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({ message: "unauthorized" }, 401));
    const usage = await getUsageForProvider({
      provider: "codebuddy",
      accessToken: "rejected-token",
      apiKey: "cb-key",
      providerSpecificData: {
        uid: "uid-1",
        enterpriseId: "enterprise-1",
        webCookie: "session=expired",
        authMode: "generated-api-key",
      },
    });

    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
    expect(usage.message).toContain("IDE OAuth token was rejected (401)");
    expect(usage.message).toContain("ZevaiRouter Usage");
    expect(usage.authMode).toBe("oauth-rejected");
    expect(usage.trackingMode).toBe("local-router");
    expect(usage.quotas).toEqual({});
  });

  it("fetches quota for codebuddy-cn using a real upstream API key against the .cn domain", async () => {
    // First call: /v2/plugin/accounts (uid lookup) — returns no cached uid in
    // providerSpecificData, so a network call happens before the quota fetch.
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({
      data: { accounts: [{ uid: "cn-uid-1", enterpriseId: "cn-ent-1", lastLogin: 1 }] },
    }));
    // Second call: the billing/meter quota endpoint.
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({
      data: {
        Response: {
          Data: {
            Accounts: [
              {
                PackageCode: "TCACA_code_001_PqouKr6QWV",
                CycleCapacitySize: 100,
                CycleCapacityRemain: 80,
                CapacityUsed: 20,
              },
            ],
          },
        },
      },
    }));

    const usage = await getUsageForProvider({
      provider: "codebuddy-cn",
      apiKey: "ck_real_upstream_key",
      providerSpecificData: {},
    });

    expect(proxyAwareFetch).toHaveBeenCalledTimes(2);
    // First call resolves uid against the .cn domain
    expect(proxyAwareFetch.mock.calls[0][0]).toBe("https://www.codebuddy.cn/v2/plugin/accounts");
    // China edition uses www.codebuddy.cn even when no domain is stored
    expect(proxyAwareFetch.mock.calls[1][0]).toBe("https://www.codebuddy.cn/v2/billing/meter/get-user-resource");
    // API key is sent as both Bearer token and X-Api-Key
    expect(proxyAwareFetch.mock.calls[1][1].headers.Authorization).toBe("Bearer ck_real_upstream_key");
    expect(proxyAwareFetch.mock.calls[1][1].headers["X-Api-Key"]).toBe("ck_real_upstream_key");
    expect(usage.authMode).toBe("api-key");
    expect(usage.quotas["Monthly Credits"]).toMatchObject({
      used: 20,
      total: 100,
      remaining: 80,
    });
  });
});
