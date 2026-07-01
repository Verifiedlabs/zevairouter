/**
 * Unit tests for open-sse/services/antigravityIdentity.js
 */

import { describe, it, expect } from "vitest";
import {
  getAntigravityAccountKey,
  isAntigravityEnterpriseAccount,
  getAntigravityEnvelopeUserAgent,
  generateAntigravityRequestId,
  generateAntigravitySessionId,
  deriveAntigravitySessionId,
  getAntigravitySessionId,
} from "../../open-sse/services/antigravityIdentity.js";

describe("getAntigravityAccountKey", () => {
  it("prefers email, then providerData email, then connectionId", () => {
    expect(getAntigravityAccountKey({ email: "a@b.com" })).toBe("a@b.com");
    expect(getAntigravityAccountKey({ providerSpecificData: { email: "c@d.com" } })).toBe("c@d.com");
    expect(getAntigravityAccountKey({ connectionId: "conn-1" })).toBe("conn-1");
    expect(getAntigravityAccountKey({})).toBe(null);
  });
});

describe("isAntigravityEnterpriseAccount / envelope UA", () => {
  it("classifies gmail as consumer (antigravity)", () => {
    expect(isAntigravityEnterpriseAccount({ email: "x@gmail.com" })).toBe(false);
    expect(getAntigravityEnvelopeUserAgent({ email: "x@gmail.com" })).toBe("antigravity");
    expect(getAntigravityEnvelopeUserAgent({ email: "x@googlemail.com" })).toBe("antigravity");
  });
  it("classifies custom domains as enterprise (jetski)", () => {
    expect(isAntigravityEnterpriseAccount({ email: "x@bukitsakura.com" })).toBe(true);
    expect(getAntigravityEnvelopeUserAgent({ email: "x@bukitsakura.com" })).toBe("jetski");
  });
  it("defaults to consumer when no email", () => {
    expect(getAntigravityEnvelopeUserAgent({})).toBe("antigravity");
  });
});

describe("deriveAntigravitySessionId", () => {
  it("is deterministic for the same key", () => {
    const a = deriveAntigravitySessionId("nurjaka@bukitsakura.com");
    const b = deriveAntigravitySessionId("nurjaka@bukitsakura.com");
    expect(a).toBe(b);
    expect(typeof a).toBe("string");
    expect(a.length).toBeGreaterThan(0);
  });
  it("differs for different keys", () => {
    expect(deriveAntigravitySessionId("a@b.com")).not.toBe(deriveAntigravitySessionId("c@d.com"));
  });
  it("returns null for empty key", () => {
    expect(deriveAntigravitySessionId("")).toBe(null);
    expect(deriveAntigravitySessionId(null)).toBe(null);
  });
});

describe("getAntigravitySessionId", () => {
  it("derives from account key when available", () => {
    const fromCreds = getAntigravitySessionId({ email: "a@b.com" });
    const direct = deriveAntigravitySessionId("a@b.com");
    expect(fromCreds).toBe(direct);
  });
  it("uses fallback when no account key", () => {
    expect(getAntigravitySessionId({}, "fallback-123")).toBe("fallback-123");
  });
  it("generates a random id when neither key nor fallback exists", () => {
    const id = getAntigravitySessionId({});
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("generateAntigravityRequestId", () => {
  it("matches the native agent/<ts>/<hex> format", () => {
    const id = generateAntigravityRequestId();
    expect(id).toMatch(/^agent\/\d+\/[0-9a-f]{8}$/);
  });
  it("is unique across calls", () => {
    expect(generateAntigravityRequestId()).not.toBe(generateAntigravityRequestId());
  });
});

describe("generateAntigravitySessionId", () => {
  it("returns a negative numeric-string id", () => {
    const id = generateAntigravitySessionId();
    expect(id).toMatch(/^-\d+$/);
  });
});
