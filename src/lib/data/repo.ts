import { cosineDistance, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  conversations,
  documentChunks,
  documents,
  knowledgeSources,
  messages,
} from "@/db/schema";
import {
  newId,
  searchMockChunks,
  store,
  type MockChunk,
} from "./mock-store";

/**
 * Data repository. Each function uses the real Drizzle/Postgres client when
 * DATABASE_URL is set, and the in-memory mock store otherwise. Callers never
 * branch on the backend themselves.
 */

export interface RetrievedChunk {
  content: string;
  documentTitle: string;
  similarity: number;
}

export async function createKnowledgeSource(input: {
  organizationId: string;
  kind: string;
  title: string;
  location?: string | null;
}): Promise<{ id: string }> {
  const db = getDb();
  if (db) {
    const [row] = await db
      .insert(knowledgeSources)
      .values({
        organizationId: input.organizationId,
        kind: input.kind,
        title: input.title,
        location: input.location ?? null,
        status: "processing",
      })
      .returning({ id: knowledgeSources.id });
    return row;
  }
  const id = newId();
  store.sources.push({
    id,
    organizationId: input.organizationId,
    kind: input.kind,
    title: input.title,
    location: input.location ?? null,
    status: "processing",
    createdAt: new Date(),
  });
  return { id };
}

export async function setSourceStatus(
  sourceId: string,
  status: string,
): Promise<void> {
  const db = getDb();
  if (db) {
    await db
      .update(knowledgeSources)
      .set({ status })
      .where(eq(knowledgeSources.id, sourceId));
    return;
  }
  const source = store.sources.find((s) => s.id === sourceId);
  if (source) source.status = status;
}

export async function listKnowledgeSources(organizationId: string) {
  const db = getDb();
  if (db) {
    return db
      .select()
      .from(knowledgeSources)
      .where(eq(knowledgeSources.organizationId, organizationId))
      .orderBy(desc(knowledgeSources.createdAt));
  }
  return store.sources
    .filter((s) => s.organizationId === organizationId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function ingestDocument(input: {
  organizationId: string;
  sourceId: string;
  title: string;
  chunks: { content: string; embedding: number[] }[];
}): Promise<{ documentId: string; chunkCount: number }> {
  const db = getDb();
  if (db) {
    const [doc] = await db
      .insert(documents)
      .values({
        organizationId: input.organizationId,
        sourceId: input.sourceId,
        title: input.title,
      })
      .returning({ id: documents.id });

    if (input.chunks.length > 0) {
      await db.insert(documentChunks).values(
        input.chunks.map((c, i) => ({
          organizationId: input.organizationId,
          documentId: doc.id,
          chunkIndex: i,
          content: c.content,
          embedding: c.embedding,
        })),
      );
    }
    return { documentId: doc.id, chunkCount: input.chunks.length };
  }

  const documentId = newId();
  store.documents.push({
    id: documentId,
    organizationId: input.organizationId,
    sourceId: input.sourceId,
    title: input.title,
  });
  const mockChunks: MockChunk[] = input.chunks.map((c, i) => ({
    id: newId(),
    organizationId: input.organizationId,
    documentId,
    documentTitle: input.title,
    chunkIndex: i,
    content: c.content,
    embedding: c.embedding,
  }));
  store.chunks.push(...mockChunks);
  return { documentId, chunkCount: mockChunks.length };
}

export async function searchChunks(
  organizationId: string,
  queryEmbedding: number[],
  k = 5,
): Promise<RetrievedChunk[]> {
  const db = getDb();
  if (db) {
    const similarity = sql<number>`1 - (${cosineDistance(
      documentChunks.embedding,
      queryEmbedding,
    )})`;
    const rows = await db
      .select({
        content: documentChunks.content,
        documentTitle: documents.title,
        similarity,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documentChunks.documentId, documents.id))
      .where(eq(documentChunks.organizationId, organizationId))
      .orderBy(desc(similarity))
      .limit(k);
    return rows.map((r) => ({
      content: r.content,
      documentTitle: r.documentTitle,
      similarity: Number(r.similarity),
    }));
  }
  return searchMockChunks(organizationId, queryEmbedding, k);
}

export async function createConversation(input: {
  organizationId: string;
  title?: string;
  prospect?: string | null;
}): Promise<{ id: string }> {
  const db = getDb();
  if (db) {
    const [row] = await db
      .insert(conversations)
      .values({
        organizationId: input.organizationId,
        title: input.title ?? "New conversation",
        prospect: input.prospect ?? null,
      })
      .returning({ id: conversations.id });
    return row;
  }
  const id = newId();
  store.conversations.push({
    id,
    organizationId: input.organizationId,
    title: input.title ?? "New conversation",
    prospect: input.prospect ?? null,
    createdAt: new Date(),
  });
  return { id };
}

export async function appendMessage(input: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}): Promise<{ id: string }> {
  const db = getDb();
  if (db) {
    const [row] = await db
      .insert(messages)
      .values({
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
      })
      .returning({ id: messages.id });
    return row;
  }
  const id = newId();
  store.messages.push({
    id,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    createdAt: new Date(),
  });
  return { id };
}

export async function countOrgStats(organizationId: string): Promise<{
  sources: number;
  conversations: number;
}> {
  const db = getDb();
  if (db) {
    const [s] = await db
      .select({ count: sql<number>`count(*)` })
      .from(knowledgeSources)
      .where(eq(knowledgeSources.organizationId, organizationId));
    const [c] = await db
      .select({ count: sql<number>`count(*)` })
      .from(conversations)
      .where(eq(conversations.organizationId, organizationId));
    return { sources: Number(s.count), conversations: Number(c.count) };
  }
  return {
    sources: store.sources.filter((x) => x.organizationId === organizationId)
      .length,
    conversations: store.conversations.filter(
      (x) => x.organizationId === organizationId,
    ).length,
  };
}
