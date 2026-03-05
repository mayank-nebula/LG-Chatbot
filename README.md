function parseGraph(
  headHtml: string,
  slug: string,
  type: string,
): object | null {
  const siteUrl = env.PUBLIC_SITE_URL;
  const parsedSchema = extractLdJson(headHtml);

  for (const schema of parsedSchema) {
    if (!schema["@graph"]) continue;

    let filteredGraph = schema["@graph"].filter((item: any) => {
      const itemType = item["@type"];
      const isExcluded = Array.isArray(itemType)
        ? itemType.includes("Organization") ||
          itemType.includes("WebSite") ||
          itemType.includes("BreadcrumbList")
        : itemType === "Organization" ||
          itemType === "WebSite" ||
          itemType === "BreadcrumbList";
      return !isExcluded;
    });

    if (type === "podcasts") {
      let filteredGraph = schema["@graph"].filter((item: any) => {
        const itemType = item["@type"];
        const isExcluded = Array.isArray(itemType)
          ? itemType.includes("BlogPosting")
          : itemType === "BlogPosting";
        return !isExcluded;
      });
    }

    const oldUrl = `${env.SITE_URL}/${slug}`;
    const newUrl =
      type === "podcasts"
        ? `${siteUrl}/podcasts/${slug}`
        : type == "blogs"
          ? `${siteUrl}/supply-chain-hub/pr-news/${slug}`
          : "";

    const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let replacedString = JSON.stringify(filteredGraph)
      .replace(new RegExp(escapedOldUrl + '(?=["/#?])', "g"), newUrl)
      .replace(new RegExp(escapedSiteUrl + '(?!/wp)(?=["/#?])', "g"), siteUrl);

    filteredGraph = JSON.parse(replacedString);

    return { "@context": "https://schema.org", "@graph": filteredGraph };
  }

  return null;
}
