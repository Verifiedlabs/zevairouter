/**
 * Unit tests for open-sse/services/antigravityObfuscation.js
 *
 * Tests cover:
 *  - obfuscateSensitiveWords() — ZWJ insertion, case-insensitivity, non-matches
 *  - obfuscateRequestBody() — JSON round-trip, immutability, non-object passthrough
 *  - the obfuscated text renders identically once ZWJ is stripped
 */

import { describe, it, expect } from "vitest";
import {
  obfuscateSensitiveWords,
  obfuscateRequestBody,
  setAntigravitySensitiveWords,
  __DEFAULT_SENSITIVE_WORDS,
} from "../../open-sse/services/antigravityObfuscation.js";

const ZWJ = "‍";
const stripZwj = (s) => s.replace(/‍/g, "");

describe("obfuscateSensitiveWords", () => {
  it("inserts a ZWJ after the first character of a sensitive word", () => {
    const out = obfuscateSensitiveWords("using cursor now");
    expect(out).not.toBe("using cursor now");
    expect(out).toContain(`c${ZWJ}ursor`);
    // Human-visible text is unchanged once the ZWJ is stripped.
    expect(stripZwj(out)).toBe("using cursor now");
  });

  it("is case-insensitive but preserves original casing", () => {
    const out = obfuscateSensitiveWords("Cursor and CURSOR");
    expect(out).toContain(`C${ZWJ}ursor`);
    expect(out).toContain(`C${ZWJ}URSOR`);
    expect(stripZwj(out)).toBe("Cursor and CURSOR");
  });

  it("obfuscates multi-word and hyphenated tool names", () => {
    const out = obfuscateSensitiveWords("claude code and claude-code and kilocode");
    expect(out).toContain(`c${ZWJ}laude code`);
    expect(out).toContain(`c${ZWJ}laude-code`);
    expect(out).toContain(`k${ZWJ}ilocode`);
  });

  it("leaves unrelated text untouched", () => {
    const input = "the quick brown fox";
    expect(obfuscateSensitiveWords(input)).toBe(input);
  });

  it("handles empty / nullish input", () => {
    expect(obfuscateSensitiveWords("")).toBe("");
    expect(obfuscateSensitiveWords(null)).toBe(null);
    expect(obfuscateSensitiveWords(undefined)).toBe(undefined);
  });

  it("respects a custom word list and resets to defaults on empty", () => {
    setAntigravitySensitiveWords(["frobnicate"]);
    expect(obfuscateSensitiveWords("frobnicate cursor")).toContain(`f${ZWJ}robnicate`);
    // cursor no longer in the list → untouched
    expect(obfuscateSensitiveWords("cursor")).toBe("cursor");
    // reset
    setAntigravitySensitiveWords([]);
    expect(obfuscateSensitiveWords("cursor")).toContain(`c${ZWJ}ursor`);
  });

  it("keeps zevairouter's own name out of the wire", () => {
    expect(__DEFAULT_SENSITIVE_WORDS).toContain("zevairouter");
    const out = obfuscateSensitiveWords("sent by zevairouter");
    expect(out).not.toContain("zevairouter");
    expect(stripZwj(out)).toContain("zevairouter");
  });
});

describe("obfuscateRequestBody", () => {
  it("obfuscates sensitive words inside a JSON body without mutating input", () => {
    const body = { system: "You are Cursor", messages: [{ text: "hi from cline" }] };
    const snapshot = JSON.stringify(body);
    const out = obfuscateRequestBody(body);

    // input untouched
    expect(JSON.stringify(body)).toBe(snapshot);
    // output has ZWJ-obfuscated words but same visible content
    expect(JSON.stringify(out)).not.toBe(snapshot);
    expect(JSON.parse(stripZwj(JSON.stringify(out)))).toEqual(body);
  });

  it("returns non-object inputs unchanged", () => {
    expect(obfuscateRequestBody(null)).toBe(null);
    expect(obfuscateRequestBody("cursor")).toBe("cursor");
    expect(obfuscateRequestBody(42)).toBe(42);
  });

  it("returns the same object reference when nothing matches", () => {
    const body = { text: "nothing to see here" };
    expect(obfuscateRequestBody(body)).toBe(body);
  });
});
