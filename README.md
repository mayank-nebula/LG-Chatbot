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

export function generateBreadcrumbList(url: string): BreadcrumbListSchema {
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

function formatSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
