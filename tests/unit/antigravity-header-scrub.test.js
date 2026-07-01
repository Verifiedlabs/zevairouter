/**
 * Unit tests for open-sse/services/antigravityHeaderScrub.js
 *
 * Tests cover:
 *  - scrubProxyAndFingerprintHeaders() — removes proxy/fingerprint headers,
 *    preserves native headers, normalizes Accept-Encoding, defers Authorization
 */

import { describe, it, expect } from "vitest";
import { scrubProxyAndFingerprintHeaders } from "../../open-sse/services/antigravityHeaderScrub.js";

describe("scrubProxyAndFingerprintHeaders", () => {
  it("removes proxy-tracing headers", () => {
    const out = scrubProxyAndFingerprintHeaders({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "1.2.3.4",
      via: "1.1 proxy",
      forwarded: "for=1.2.3.4",
      "Content-Type": "application/json",
    });
    expect(out["x-forwarded-for"]).toBeUndefined();
    expect(out["x-real-ip"]).toBeUndefined();
    expect(out.via).toBeUndefined();
    expect(out.forwarded).toBeUndefined();
    expect(out["Content-Type"]).toBe("application/json");
  });

  it("removes Chromium/Electron fingerprint headers", () => {
    const out = scrubProxyAndFingerprintHeaders({
      "sec-ch-ua": "\"Chromium\";v=\"142\"",
      "sec-fetch-mode": "cors",
      priority: "u=1, i",
      "Content-Type": "application/json",
    });
    expect(out["sec-ch-ua"]).toBeUndefined();
    expect(out["sec-fetch-mode"]).toBeUndefined();
    expect(out.priority).toBeUndefined();
  });

  it("removes Stainless SDK headers (Claude Code fingerprint)", () => {
    const out = scrubProxyAndFingerprintHeaders({
      "x-stainless-lang": "js",
      "x-stainless-os": "MacOS",
      "x-title": "Claude Code",
      referer: "https://example.com",
    });
    expect(out["x-stainless-lang"]).toBeUndefined();
    expect(out["x-stainless-os"]).toBeUndefined();
    expect(out["x-title"]).toBeUndefined();
    expect(out.referer).toBeUndefined();
  });

  it("preserves native Antigravity headers (session id, MITM bypass, content-type)", () => {
    const out = scrubProxyAndFingerprintHeaders({
      "Content-Type": "application/json",
      "x-request-source": "local",
      "X-Machine-Session-Id": "sess-123",
      Accept: "text/event-stream",
    });
    expect(out["Content-Type"]).toBe("application/json");
    expect(out["x-request-source"]).toBe("local");
    expect(out["X-Machine-Session-Id"]).toBe("sess-123");
    expect(out.Accept).toBe("text/event-stream");
  });

  it("normalizes Accept-Encoding to the Node.js default (drops zstd)", () => {
    const out = scrubProxyAndFingerprintHeaders({
      "accept-encoding": "gzip, deflate, br, zstd",
    });
    expect(out["accept-encoding"]).toBeUndefined();
    expect(out["Accept-Encoding"]).toBe("gzip, deflate, br");
  });

  it("defers Authorization so it serializes last", () => {
    const out = scrubProxyAndFingerprintHeaders({
      Authorization: "Bearer tok",
      "Content-Type": "application/json",
      "x-request-source": "local",
    });
    const keys = Object.keys(out);
    expect(out.Authorization).toBe("Bearer tok");
    expect(keys[keys.length - 1]).toBe("Authorization");
  });

  it("strips internal x-zevai-* routing headers", () => {
    const out = scrubProxyAndFingerprintHeaders({
      "x-zevai-connection-id": "abc",
      "Content-Type": "application/json",
    });
    expect(out["x-zevai-connection-id"]).toBeUndefined();
  });

  it("handles empty / nullish input", () => {
    expect(scrubProxyAndFingerprintHeaders({})).toEqual({ "Accept-Encoding": "gzip, deflate, br" });
    expect(scrubProxyAndFingerprintHeaders(null)).toEqual({ "Accept-Encoding": "gzip, deflate, br" });
  });
});
