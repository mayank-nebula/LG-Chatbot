import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";

function cleanLdJson(raw: string): string {
  let cleaned = raw.replace(/\\'/g, "'");
  cleaned = cleaned.replace(/\\&/g, "&");
  cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, "$1");
  return cleaned;
}

function extractLdJson(html: string): any[] {
  const results: any[] = [];
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw || !raw.trim()) continue;

    try {
      results.push(JSON.parse(raw));
      continue;
    } catch (e) {}

    try {
      const cleaned = cleanLdJson(raw);
      results.push(JSON.parse(cleaned));
    } catch (e) {
      console.warn("Warning: Failed to parse ld+json block after cleaning:", e);
    }
  }

  return results;
}

export async function getPageGraph(slug: string, type: string) {
  try {
    const url = `${env.SITE_URL}/wp-json/rankmath/v1/getHead?url=${env.SITE_URL}/${slug}`;
    const res = await safeFetchJSON(url);

    if (!res || !res.head) return null;

    const headHtml = res.head;
    const parsedSchema = extractLdJson(headHtml);

    for (const schema of parsedSchema) {
      if (schema["@graph"]) {
        let filteredGraph = schema["@graph"].filter((item: any) => {
          const itemType = item["@type"];
          const isExcludedType = Array.isArray(itemType)
            ? itemType.includes("Organization") ||
              itemType.includes("WebSite") ||
              itemType.includes("BreadcrumbList")
            : itemType === "Organization" ||
              itemType === "WebSite" ||
              itemType == "BreadcrumbList";

          return !isExcludedType;
        });

        if (type === "blogs" || type === "news") {
          const targetType = type === "blogs" ? "BlogPosting" : "NewsArticle";
          filteredGraph.forEach((item: any) => {
            if (!item["@type"]) return;

            if (item["@type"] === "PodcastEpisode") {
              item["@type"] = targetType;
              return;
            }

            if (typeof item["@type"] == "string") {
              item["@type"] = targetType;
              return;
            }

            if (Array.isArray(item["@type"])) {
              item["@type"] = item["@type"].map((t: string) =>
                [
                  "Article",
                  "BlogPosting",
                  "NewsArticle",
                  "PodcastEpisode",
                ].includes(t)
                  ? targetType
                  : t,
              );
            }
          });
        }

        const siteUrl = env.PUBLIC_SITE_URL;
        const oldUrl = `${env.SITE_URL}/${slug}`;
        const newUrl =
          type === "podcasts"
            ? `${siteUrl}/podcasts/${slug}`
            : `${siteUrl}/supply-chain-hub/pr-news/${slug}`;

        const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedOldUrl + '(?=["/#?])', "g");

        const graphString = JSON.stringify(filteredGraph);
        const replacedString = graphString.replace(regex, newUrl);
        filteredGraph = JSON.parse(replacedString);

        return {
          "@context": "https://schema.org",
          "@graph": filteredGraph,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching schema data:", error);
    return null;
  }
}
