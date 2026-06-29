import { env, EMBEDDING_DIMENSIONS } from "@/lib/env";

/**
 * Embedding provider.
 *
 * Real mode calls Voyage AI's REST embeddings endpoint (`voyage-3`, 1024-dim).
 * Mock mode produces deterministic pseudo-embeddings derived from a hash of the
 * input, so the same text always maps to the same vector. That determinism is
 * what lets retrieval work — and be tested — without any API key.
 */

const VOYAGE_ENDPOINT = "https://api.voyageai.com/v1/embeddings";

export async function embedTexts(
  texts: string[],
  inputType: "document" | "query" = "document",
): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (!env.hasVoyage) {
    return texts.map((t) => mockEmbedding(t));
  }
  return voyageEmbed(texts, inputType);
}

export async function embedText(
  text: string,
  inputType: "document" | "query" = "document",
): Promise<number[]> {
  const [vector] = await embedTexts([text], inputType);
  return vector;
}

async function voyageEmbed(
  texts: string[],
  inputType: "document" | "query",
): Promise<number[][]> {
  const res = await fetch(VOYAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Voyage embedding failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/**
 * Deterministic mock embedding. A simple seeded PRNG keyed by the input text
 * fills a unit-normalized vector, so identical text always yields an identical
 * vector and similar text shares no special relationship (good enough to make
 * exact-match retrieval deterministic for demos and tests).
 */
export function mockEmbedding(text: string): number[] {
  const seed = hashString(text.trim().toLowerCase());
  const rng = mulberry32(seed);
  const vec = new Array<number>(EMBEDDING_DIMENSIONS);
  let normSq = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const v = rng() * 2 - 1;
    vec[i] = v;
    normSq += v * v;
  }
  const norm = Math.sqrt(normSq) || 1;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) vec[i] /= norm;
  return vec;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
