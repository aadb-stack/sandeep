import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { EMBEDDING_DIMENSIONS } from "@/lib/env";

/**
 * Schema for the AI Sales Engineer.
 *
 * Tenancy: everything is scoped to an `organization` (a customer company). Orgs
 * own knowledge sources (their product docs / API specs), which are ingested
 * into documents -> chunks (the RAG store). Prospect-facing chats live in
 * conversations -> messages, and generated demo code lives in code_artifacts.
 */

// --- Tenancy -------------------------------------------------------------

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkOrgId: text("clerk_org_id").unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: text("plan").notNull().default("starter"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").unique(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("memberships_org_user_idx").on(
      table.organizationId,
      table.userId,
    ),
  ],
);

// --- Knowledge / RAG -----------------------------------------------------

export const knowledgeSources = pgTable("knowledge_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // "doc" | "url" | "openapi"
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  // raw URL or file reference, when applicable
  location: text("location"),
  // "pending" | "processing" | "ready" | "failed"
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => knowledgeSources.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("document_chunks_org_idx").on(table.organizationId),
    index("document_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops"),
    ),
  ],
);

// --- Conversations -------------------------------------------------------

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New conversation"),
  // Optional prospect identifier (e.g. email captured on the demo page)
  prospect: text("prospect"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  // "user" | "assistant"
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const codeArtifacts = pgTable("code_artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("javascript"),
  filename: text("filename").notNull().default("demo.js"),
  code: text("code").notNull(),
  // Sandpack template, e.g. "vanilla" | "react" | "node"
  template: text("template").notNull().default("vanilla"),
  files: jsonb("files"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Relations -----------------------------------------------------------

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  knowledgeSources: many(knowledgeSources),
  conversations: many(conversations),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const knowledgeSourcesRelations = relations(
  knowledgeSources,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [knowledgeSources.organizationId],
      references: [organizations.id],
    }),
    documents: many(documents),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  source: one(knowledgeSources, {
    fields: [documents.sourceId],
    references: [knowledgeSources.id],
  }),
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [conversations.organizationId],
      references: [organizations.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  artifacts: many(codeArtifacts),
}));

export const codeArtifactsRelations = relations(codeArtifacts, ({ one }) => ({
  message: one(messages, {
    fields: [codeArtifacts.messageId],
    references: [messages.id],
  }),
}));

// --- Types ---------------------------------------------------------------

export type Organization = typeof organizations.$inferSelect;
export type KnowledgeSource = typeof knowledgeSources.$inferSelect;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type CodeArtifact = typeof codeArtifacts.$inferSelect;
