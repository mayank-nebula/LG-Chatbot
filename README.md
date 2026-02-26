import { breadcrumbs } from '@forge42/seo-tools/structured-data/breadcrumb';

function generateBreadcrumbsFromUrl(url: string) {
  const parsedUrl = new URL(url);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

  const segments = parsedUrl.pathname
    .split('/')
    .filter(Boolean);

  const breadcrumbItems = [
    { name: 'Home', url: baseUrl },
  ];

  let currentPath = '';

  segments.forEach((segment) => {
    currentPath += `/${segment}`;

    const formattedName = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    breadcrumbItems.push({
      name: formattedName,
      url: `${baseUrl}${currentPath}`,
    });
  });

  return breadcrumbs(breadcrumbItems);
}
