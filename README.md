function parseGraph(
  headHtml: string,
  slug: string,
  type: string,
): object | null {
  const siteUrl = env.PUBLIC_SITE_URL;
  const parsedSchema: ParsedSchema[] = extractLdJson(headHtml);

  // Find the first schema that actually contains a @graph
  const schema = parsedSchema.find((s) => s["@graph"]);
  if (!schema || !schema["@graph"]) return null;

  // 1. Define types to exclude based on the 'type' argument
  const excludedTypes = new Set(["Organization", "WebSite", "BreadcrumbList"]);
  
  if (type === "podcasts") {
    // Note: Assuming you wanted to ADD 'BlogPosting' to the exclusions for podcasts
    excludedTypes.add("BlogPosting"); 
  }

  // 2. Filter the graph cleanly
  const filteredItems = schema["@graph"].filter((item) => {
    if (!item["@type"]) return true;
    
    // Normalize itemType to an array so we can check it uniformly
    const itemTypes = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
    
    // Check if ANY of the item's types are in our excluded set
    const isExcluded = itemTypes.some((t) => excludedTypes.has(t));
    return !isExcluded;
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
