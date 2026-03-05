function parseGraph(
  headHtml: string,
  slug: string,
  type: string,
): object | null {
  const siteUrl = env.PUBLIC_SITE_URL;
  const parsedSchema = extractLdJson(headHtml);

  for (const schema of parsedSchema) {
    if (!schema["@graph"]) continue;

    const excludedTypes = ["Organization", "WebSite", "BreadcrumbList"];

    if (type === "podcasts") {
      excludedTypes.push("BlogPosting");
    }

    let filteredGraph = schema["@graph"].filter((item: any) => {
      const itemType = item["@type"];
      // Convert to array so we don't have to write separate logic for strings vs arrays
      const types = Array.isArray(itemType) ? itemType : [itemType];
      
      // Return true only if NONE of the types match our excluded list
      return !types.some((t: string) => excludedTypes.includes(t));
    });

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
