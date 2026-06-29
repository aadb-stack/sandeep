/**
 * Approximate-token-aware text chunking.
 *
 * We avoid a heavyweight tokenizer dependency and approximate ~4 chars/token
 * (a reasonable English heuristic). Chunks split on paragraph/sentence
 * boundaries where possible so retrieved context stays readable, with a small
 * overlap to preserve meaning across boundaries.
 */

export interface ChunkOptions {
  /** Target maximum tokens per chunk. */
  maxTokens?: number;
  /** Tokens of overlap carried between adjacent chunks. */
  overlapTokens?: number;
}

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function chunkText(input: string, options: ChunkOptions = {}): string[] {
  const maxTokens = options.maxTokens ?? 400;
  const overlapTokens = options.overlapTokens ?? 40;
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;

  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (normalized.length === 0) return [];
  if (normalized.length <= maxChars) return [normalized];

  // Split into paragraph-ish units first, then greedily pack into chunks.
  const units = normalized
    .split(/\n{2,}/)
    .flatMap((para) => splitIfTooLong(para, maxChars))
    .filter((u) => u.trim().length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const unit of units) {
    const candidate = current.length === 0 ? unit : `${current}\n\n${unit}`;
    if (candidate.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      // Start the next chunk with a tail overlap from the previous one.
      const tail = current.slice(Math.max(0, current.length - overlapChars));
      current = `${tail}\n\n${unit}`;
    } else {
      current = candidate;
    }
  }
  if (current.trim().length > 0) chunks.push(current.trim());

  return chunks;
}

/** Hard-split a single oversized unit on sentence boundaries, then by length. */
function splitIfTooLong(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const sentences = text.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let buf = "";
  for (const sentence of sentences) {
    const candidate = buf.length === 0 ? sentence : `${buf} ${sentence}`;
    if (candidate.length > maxChars && buf.length > 0) {
      out.push(buf);
      buf = sentence;
    } else {
      buf = candidate;
    }
  }
  if (buf.length > 0) out.push(buf);

  // Anything still too long (e.g. a giant unbroken blob) gets a length split.
  return out.flatMap((piece) =>
    piece.length <= maxChars ? [piece] : hardSplit(piece, maxChars),
  );
}

function hardSplit(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    out.push(text.slice(i, i + maxChars));
  }
  return out;
}
