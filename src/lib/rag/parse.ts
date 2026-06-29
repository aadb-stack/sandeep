/**
 * Lightweight source parsers. The scaffold supports plain text / markdown,
 * JSON, and OpenAPI specs (JSON). Each parser returns readable text suitable
 * for chunking + embedding. Richer parsers (PDF, HTML scraping) are a
 * post-scaffold concern.
 */

export type SourceKind = "doc" | "url" | "openapi";

export function parseSource(kind: SourceKind, raw: string): string {
  switch (kind) {
    case "openapi":
      return parseOpenApi(raw);
    case "doc":
    case "url":
    default:
      return parsePlainOrJson(raw);
  }
}

function parsePlainOrJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return jsonToText(JSON.parse(trimmed));
    } catch {
      // fall through: treat as plain text
    }
  }
  return trimmed;
}

/**
 * Flatten an OpenAPI spec into endpoint-oriented text so retrieval can surface
 * "how do I call X" answers. Falls back to generic JSON flattening on parse
 * issues or unexpected shapes.
 */
function parseOpenApi(raw: string): string {
  let spec: any;
  try {
    spec = JSON.parse(raw);
  } catch {
    return raw.trim();
  }

  const lines: string[] = [];
  const info = spec.info ?? {};
  if (info.title) lines.push(`API: ${info.title}`);
  if (info.description) lines.push(info.description);
  if (info.version) lines.push(`Version: ${info.version}`);

  const paths = spec.paths ?? {};
  for (const [path, methods] of Object.entries<any>(paths)) {
    for (const [method, op] of Object.entries<any>(methods ?? {})) {
      if (typeof op !== "object" || op === null) continue;
      const summary = op.summary ?? op.operationId ?? "";
      lines.push(`\n${method.toUpperCase()} ${path} — ${summary}`.trimEnd());
      if (op.description) lines.push(op.description);
      const params = op.parameters ?? [];
      for (const p of params) {
        if (p && p.name) {
          lines.push(
            `  param ${p.name} (${p.in ?? "?"}): ${p.description ?? ""}`.trimEnd(),
          );
        }
      }
    }
  }

  return lines.join("\n").trim() || jsonToText(spec);
}

function jsonToText(value: unknown, prefix = ""): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return `${prefix}${String(value)}`;
  if (Array.isArray(value)) {
    return value
      .map((item, i) => jsonToText(item, `${prefix}[${i}] `))
      .filter(Boolean)
      .join("\n");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([k, v]) =>
      typeof v === "object" && v !== null
        ? `${prefix}${k}:\n${jsonToText(v, prefix + "  ")}`
        : `${prefix}${k}: ${String(v)}`,
    )
    .filter(Boolean)
    .join("\n");
}
