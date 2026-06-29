import {
  createKnowledgeSource,
  ingestDocument,
  setSourceStatus,
} from "@/lib/data/repo";
import { chunkText } from "./chunk";
import { embedTexts } from "./embed";
import { parseSource, type SourceKind } from "./parse";

export interface IngestInput {
  organizationId: string;
  kind: SourceKind;
  title: string;
  /** Raw text/markdown/JSON/OpenAPI content of the source. */
  content: string;
  location?: string | null;
}

export interface IngestResult {
  sourceId: string;
  documentId: string;
  chunkCount: number;
}

/**
 * End-to-end ingestion: register the source, parse + chunk the content, embed
 * every chunk, and persist. Marks the source `ready` on success, `failed`
 * otherwise. Works identically against Postgres or the in-memory store.
 */
export async function ingestSource(input: IngestInput): Promise<IngestResult> {
  const source = await createKnowledgeSource({
    organizationId: input.organizationId,
    kind: input.kind,
    title: input.title,
    location: input.location ?? null,
  });

  try {
    const text = parseSource(input.kind, input.content);
    const chunks = chunkText(text);
    const embeddings = await embedTexts(chunks, "document");
    const { documentId, chunkCount } = await ingestDocument({
      organizationId: input.organizationId,
      sourceId: source.id,
      title: input.title,
      chunks: chunks.map((content, i) => ({
        content,
        embedding: embeddings[i],
      })),
    });
    await setSourceStatus(source.id, "ready");
    return { sourceId: source.id, documentId, chunkCount };
  } catch (err) {
    await setSourceStatus(source.id, "failed");
    throw err;
  }
}
