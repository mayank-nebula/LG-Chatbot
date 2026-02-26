export function appendToGraph(
  existingGraph: JsonLdGraph | null | undefined,
  newNode: JsonLdNode
): JsonLdGraph {
  const graph: JsonLdNode[] = Array.isArray(existingGraph?.["@graph"])
    ? [...(existingGraph!["@graph"] as JsonLdNode[])]
    : [];

  const alreadyExists = graph.some(
    (node) => node["@type"] === newNode["@type"]
  );

  if (!alreadyExists) {
    graph.push(newNode);
  }

  return {
    "@context": existingGraph?.["@context"] ?? "https://schema.org",
    "@graph": graph,
  };
}
