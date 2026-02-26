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
 * Generate a Schema.org BreadcrumbList object from a full URL.
 * Returns ONLY the BreadcrumbList object (no @context, no graph wrapper).
 */
export function generateBreadcrumbList(url: string): BreadcrumbListSchema {
  const parsedUrl = new URL(url);

  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  // Clean pathname (remove trailing slash)
  const cleanPath = parsedUrl.pathname.replace(/\/+$/, "");

  // Split path into segments
  const segments = cleanPath.split("/").filter(Boolean);

  const itemListElement: BreadcrumbListItem[] = [];

  // Always include Home
  itemListElement.push({
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: baseUrl,
  });

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Format slug into readable text
    const formattedName = decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

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
