import { describe, expect, it } from "vitest";
import { EMBEDDING_DIMENSIONS } from "@/lib/env";
import { mockEmbedding } from "./embed";
import { magnitude, cosineSimilarity } from "./math";

describe("mockEmbedding", () => {
  it("produces vectors of the configured dimensionality", () => {
    expect(mockEmbedding("hello")).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("is deterministic for identical text", () => {
    expect(mockEmbedding("create a charge")).toEqual(
      mockEmbedding("create a charge"),
    );
  });

  it("is case/whitespace insensitive", () => {
    expect(mockEmbedding("  Create A Charge  ")).toEqual(
      mockEmbedding("create a charge"),
    );
  });

  it("produces unit-normalized vectors", () => {
    expect(magnitude(mockEmbedding("anything"))).toBeCloseTo(1, 6);
  });

  it("identical text has cosine similarity ~1", () => {
    expect(
      cosineSimilarity(mockEmbedding("refund"), mockEmbedding("refund")),
    ).toBeCloseTo(1, 6);
  });

  it("different text produces different vectors", () => {
    expect(mockEmbedding("alpha")).not.toEqual(mockEmbedding("beta"));
  });
});
