interface JsonLdGraph {
  "@context"?: string;
  "@graph"?: Record<string, any>[];
}

/**
 * Safely append a schema node into an existing JSON-LD graph.
 * - Preserves @context
 * - Creates @graph if missing
 * - Prevents duplicates by @type (optional safeguard)
 */
export function appendToGraph(
  existingJsonLd: JsonLdGraph,
  newNode: Record<string, any>
): JsonLdGraph {
  const result: JsonLdGraph = { ...existingJsonLd };

  // Ensure @context exists
  if (!result["@context"]) {
    result["@context"] = "https://schema.org";
  }

  // Ensure @graph exists
  if (!Array.isArray(result["@graph"])) {
    result["@graph"] = [];
  }

  // Optional: avoid duplicate BreadcrumbList
  const alreadyExists = result["@graph"].some(
    (node) => node["@type"] === newNode["@type"]
  );

  if (!alreadyExists) {
    result["@graph"].push(newNode);
  }

  return result;
}
