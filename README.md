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

/**
 * Generate Schema.org BreadcrumbList from a full absolute URL.
 * No external libraries required.
 */
export function generateBreadcrumbList(url: string): BreadcrumbListSchema {
  if (!url) {
    throw new Error("URL is required to generate breadcrumbs.");
  }

  const parsedUrl = new URL(url);

  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  // Remove trailing slashes
  const cleanPath = parsedUrl.pathname.replace(/\/+$/, "");

  // Split path into segments
  const segments = cleanPath.split("/").filter(Boolean);

  const itemListElement: BreadcrumbListItem[] = [];

  // Always add Home
  itemListElement.push({
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: baseUrl,
  });

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    const formattedName = formatSegment(segment);

    itemListElement.push({
      "@type": "ListItem",
      position: index + 2,
      name: formattedName,
      item: `${baseUrl}${currentPath}`,
    });
  });

  return {
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

/**
 * Convert URL segment into human-readable breadcrumb name
 */
function formatSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
