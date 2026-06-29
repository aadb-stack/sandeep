/** Dot product of two equal-length vectors. */
export function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/** L2 norm (magnitude) of a vector. */
export function magnitude(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

/**
 * Cosine similarity in [-1, 1]. Returns 0 if either vector has zero magnitude.
 * Used by the in-memory vector store to rank chunks the same way pgvector's
 * `vector_cosine_ops` does in production.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector length mismatch: ${a.length} !== ${b.length}`,
    );
  }
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}
