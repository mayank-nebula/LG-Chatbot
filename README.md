import type { BreadcrumbListSchema } from "./breadcrumb";
import { generateBreadcrumbList } from "./breadcrumb";

export type JsonLdNode = Record<string, unknown>;

export interface JsonLdGraph {
  "@context"?: string;
  "@graph"?: JsonLdNode[];
}

export function appendToGraph(
  existingGraph: JsonLdGraph | null | undefined,
  newNode: Record<string, unknown>
): JsonLdGraph {
  const graph: JsonLdNode[] = Array.isArray(existingGraph?.["@graph"])
    ? [...(existingGraph!["@graph"] as JsonLdNode[])]
    : [];

  const alreadyExists = graph.some(
    (node) => node["@type"] === newNode["@type"]
  );

  if (!alreadyExists) {
    graph.push(newNode as JsonLdNode);
  }

  return {
    "@context": existingGraph?.["@context"] ?? "https://schema.org",
    "@graph": graph,
  };
}

export function buildGraphWithBreadcrumbs(
  url: string,
  existingGraph?: JsonLdGraph | null
): JsonLdGraph {
  const breadcrumb: BreadcrumbListSchema = generateBreadcrumbList(url);
  return appendToGraph(existingGraph, breadcrumb);
}
