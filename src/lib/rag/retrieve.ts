import { searchChunks, type RetrievedChunk } from "@/lib/data/repo";
import { embedText } from "./embed";

export type { RetrievedChunk };

/**
 * Embed the prospect's question and return the top-k most similar chunks for
 * the org. Backed by pgvector cosine search in production and the in-memory
 * cosine ranking in mock mode.
 */
export async function retrieveContext(
  organizationId: string,
  query: string,
  k = 5,
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedText(query, "query");
  return searchChunks(organizationId, queryEmbedding, k);
}

/** Render retrieved chunks into a compact context block for the system prompt. */
export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "No product documentation has been ingested yet.";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] (source: ${c.documentTitle}, score: ${c.similarity.toFixed(
          3,
        )})\n${c.content}`,
    )
    .join("\n\n");
}
