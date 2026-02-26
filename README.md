type JsonLdNode = Record<string, any>;

interface JsonLdGraph {
  "@context"?: string;
  "@graph"?: JsonLdNode[];
}

/**
 * Append a schema node into an existing JSON-LD graph safely.
 */
export function appendToGraph(
  existingGraph: JsonLdGraph | null,
  newNode: JsonLdNode
): JsonLdGraph {
  const result: JsonLdGraph = {
    "@context": existingGraph?.["@context"] ?? "https://schema.org",
    "@graph": Array.isArray(existingGraph?.["@graph"])
      ? [...existingGraph!["@graph"]]
      : [],
  };

  // Prevent duplicate BreadcrumbList
  const alreadyExists = result["@graph"].some(
    (node) => node["@type"] === newNode["@type"]
  );

  if (!alreadyExists) {
    result["@graph"].push(newNode);
  }

  return result;
}
