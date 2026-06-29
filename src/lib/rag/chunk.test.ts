import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens } from "./chunk";

describe("chunkText", () => {
  it("returns no chunks for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("returns a single chunk for short input", () => {
    const chunks = chunkText("Hello world. This is short.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("Hello world");
  });

  it("splits long input into multiple chunks", () => {
    const para = "Sentence number one is here. ".repeat(40);
    const input = `${para}\n\n${para}\n\n${para}`;
    const chunks = chunkText(input, { maxTokens: 100, overlapTokens: 10 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("respects the approximate max chunk size", () => {
    const input = "word ".repeat(2000);
    const maxTokens = 120;
    const chunks = chunkText(input, { maxTokens, overlapTokens: 10 });
    const maxChars = maxTokens * 4;
    for (const chunk of chunks) {
      // Allow some slack for overlap/boundary handling.
      expect(chunk.length).toBeLessThanOrEqual(maxChars * 1.5);
    }
  });

  it("hard-splits a single unbroken blob", () => {
    const blob = "x".repeat(5000);
    const chunks = chunkText(blob, { maxTokens: 100 });
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe("estimateTokens", () => {
  it("approximates ~4 chars per token", () => {
    expect(estimateTokens("12345678")).toBe(2);
  });
});
