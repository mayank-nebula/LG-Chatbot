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

    if (type === "blogs" || type === "news" || type === "podcasts") {
      const targetType =
        type === "blogs"
          ? "BlogPosting"
          : type === "news"
            ? "NewsArticle"
            : "PodcastEpisode";

      const typesToReplace = [
        "Article",
        "BlogPosting",
        "NewsArticle",
        "PodcastEpisode",
      ];

      filteredGraph.forEach((item: any) => {
        if (!item["@type"]) return;
        if (typeof item["@type"] === "string") {
          if (typesToReplace.includes(item["@type"]))
            item["@type"] = targetType;
          return;
        }
        if (Array.isArray(item["@type"])) {
          item["@type"] = item["@type"].map((t: string) =>
            typesToReplace.includes(t) ? targetType : t,
          );
        }
      });
    }

    const oldUrl = `${env.SITE_URL}/${slug}`;
    const newUrl =
      type === "podcasts"
        ? `${siteUrl}/podcasts/${slug}`
        : `${siteUrl}/supply-chain-hub/pr-news/${slug}`;

    const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    let replacedString = JSON.stringify(filteredGraph)
      .replace(new RegExp(escapedOldUrl + '(?=["/#?])', "g"), newUrl)
      .replace(
        new RegExp(escapedSiteUrl + '(?!/wp)(?=["/#?])', "g"),
        siteUrl,
      );

    filteredGraph = JSON.parse(replacedString);

    return { "@context": "https://schema.org", "@graph": filteredGraph };
  }

  return null;
}
