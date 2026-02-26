export type JsonLdNode = Record<string, unknown>;

export interface JsonLdGraph {
  "@context"?: string;
  "@graph"?: JsonLdNode[];
}

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






export interface BreadcrumbListItem {
  "@type": "ListItem";
  position: number;
  name: string;
  item: string;
}

export interface BreadcrumbListSchema {
  "@type": "BreadcrumbList";
  itemListElement: BreadcrumbListItem[];
}

function formatSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function generateBreadcrumbList(url: string): Record<string, unknown> {
  if (!url) {
    throw new Error("URL is required to generate breadcrumbs.");
  }

  const parsedUrl = new URL(url);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const cleanPath = parsedUrl.pathname.replace(/\/+$/, "");
  const segments = cleanPath.split("/").filter(Boolean);

  const itemListElement: BreadcrumbListItem[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: baseUrl,
    },
  ];

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    itemListElement.push({
      "@type": "ListItem",
      position: index + 2,
      name: formatSegment(segment),
      item: `${baseUrl}${currentPath}`,
    });
  });

  return {
    "@type": "BreadcrumbList",
    itemListElement,
  };
}



