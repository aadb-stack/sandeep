import { randomUUID } from "crypto";
import { cosineSimilarity } from "@/lib/rag/math";

/**
 * Process-wide in-memory store used whenever DATABASE_URL is unset. It mirrors
 * the slice of the schema the app actually reads/writes at runtime and performs
 * cosine retrieval in JS — the same ranking pgvector does in production. State
 * lives only for the lifetime of the server process (fine for local dev / CI).
 */

export interface MockSource {
  id: string;
  organizationId: string;
  kind: string;
  title: string;
  location: string | null;
  status: string;
  createdAt: Date;
}

export interface MockDocument {
  id: string;
  organizationId: string;
  sourceId: string;
  title: string;
}

export interface MockChunk {
  id: string;
  organizationId: string;
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  content: string;
  embedding: number[];
}

export interface MockConversation {
  id: string;
  organizationId: string;
  title: string;
  prospect: string | null;
  createdAt: Date;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface Store {
  sources: MockSource[];
  documents: MockDocument[];
  chunks: MockChunk[];
  conversations: MockConversation[];
  messages: MockMessage[];
}

// Persist across hot-reloads in dev via globalThis.
const globalForStore = globalThis as unknown as { __mockStore?: Store };

export const store: Store =
  globalForStore.__mockStore ??
  (globalForStore.__mockStore = {
    sources: [],
    documents: [],
    chunks: [],
    conversations: [],
    messages: [],
  });

export function newId(): string {
  return randomUUID();
}

export function searchMockChunks(
  organizationId: string,
  queryEmbedding: number[],
  k: number,
): { content: string; documentTitle: string; similarity: number }[] {
  return store.chunks
    .filter((c) => c.organizationId === organizationId)
    .map((c) => ({
      content: c.content,
      documentTitle: c.documentTitle,
      similarity: cosineSimilarity(queryEmbedding, c.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}
