import { describe, expect, it } from "vitest";
import { ingestDocument, searchChunks } from "@/lib/data/repo";
import { mockEmbedding } from "./embed";

/**
 * Exercises the in-memory vector store end-to-end (no DATABASE_URL set in test
 * env => mock backend). Verifies cosine ranking surfaces the matching chunk.
 */
describe("retrieval (in-memory store)", () => {
  it("ranks the exact-match chunk first with similarity ~1", async () => {
    const organizationId = `test-org-${Math.random().toString(36).slice(2)}`;
    await ingestDocument({
      organizationId,
      sourceId: "src-1",
      title: "API Docs",
      chunks: [
        {
          content: "how to create a charge",
          embedding: mockEmbedding("how to create a charge"),
        },
        {
          content: "how to refund a charge",
          embedding: mockEmbedding("how to refund a charge"),
        },
        {
          content: "how to list customers",
          embedding: mockEmbedding("how to list customers"),
        },
      ],
    });

    const results = await searchChunks(
      organizationId,
      mockEmbedding("how to create a charge"),
      2,
    );

    expect(results).toHaveLength(2);
    expect(results[0].content).toBe("how to create a charge");
    expect(results[0].similarity).toBeCloseTo(1, 5);
    expect(results[0].documentTitle).toBe("API Docs");
    expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
  });

  it("scopes results to the organization", async () => {
    const orgA = `org-a-${Math.random().toString(36).slice(2)}`;
    const orgB = `org-b-${Math.random().toString(36).slice(2)}`;
    await ingestDocument({
      organizationId: orgA,
      sourceId: "a",
      title: "A",
      chunks: [{ content: "secret-a", embedding: mockEmbedding("secret-a") }],
    });
    const results = await searchChunks(orgB, mockEmbedding("secret-a"), 5);
    expect(results).toHaveLength(0);
  });
});
