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
            ? itemType.includes("Organization") || itemType.includes("WebSite")
            : itemType === "Organization" || itemType === "WebSite";

          return !isExcludedType;
        });

        if (type !== "podcasts") {
          const targetType = type === "blogs" ? "BlogPosting" : "NewsArticle";
          
          filteredGraph.forEach((item: any) => {
            if (
              item["@type"] === "Article" ||
              item["@type"] === "BlogPosting" ||
              item["@type"] === "NewsArticle"
            ) {
              item["@type"] = targetType;
            } else if (Array.isArray(item["@type"])) {
              const index = item["@type"].findIndex((t: string) => 
                ["Article", "BlogPosting", "NewsArticle"].includes(t)
              );
              if (index !== -1) {
                item["@type"][index] = targetType;
              }
            }
          });
        }

        const siteUrl = env.PUBLIC_SITE_URL;
        const oldUrl = `${env.SITE_URL}/${slug}`;
        const newUrl = type === "podcasts" 
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
