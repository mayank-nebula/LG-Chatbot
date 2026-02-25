import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";

function cleanLdJson(raw: string): string {
  // Replace invalid \' with just ' (most common culprit)
  let cleaned = raw.replace(/\\'/g, "'");

  // Replace invalid \& with &
  cleaned = cleaned.replace(/\\&/g, "&");

  // Remove any other invalid single-char escapes not allowed in JSON
  // Valid JSON escapes: \" \\ \/ \b \f \n \r \t \uXXXX
  // This regex matches a backslash followed by any character NOT in that valid list,
  // and replaces it with just the character itself.
  cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, "$1");

  return cleaned;
}

function extractLdJson(html: string): any[] {
  const results: any[] = [];

  // Find all <script type="application/ld+json">...</script>
  // This regex handles any attributes that might appear before or after the type attribute.
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    const raw = match[1];
    if (!raw || !raw.trim()) continue;

    // First attempt: parse as-is
    try {
      results.push(JSON.parse(raw));
      continue;
    } catch (e) {
      // Failed to parse, move to second attempt
    }

    // Second attempt: clean invalid escapes then retry
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

    const headHtml = res?.head;
    const parsedSchema = extractLdJson(headHtml);

    for (const schema of parsedSchema) {
      if (schema["@graph"]) {
        let filteredGraph = schema["@graph"].filter((item: any) => {
          const type = item["@type"];
          const isExcludedType = Array.isArray(type)
            ? type.includes("Organization") || type.includes("WebSite")
            : type === "Organization" || type === "WebSite";

          return !isExcludedType;
        });

        if (type === "podcasts") {
          const siteUrl = env.PUBLIC_SITE_URL;
          const oldUrl = `${env.SITE_URL}/${slug}`;
          const newUrl = `${siteUrl}/podcasts/${slug}`;

          const graphString = JSON.stringify(filteredGraph);
          const replacedString = graphString.replace(
            new RegExp(oldUrl, "g"),
            newUrl,
          );
          filteredGraph = JSON.parse(replacedString);
        } else {
          if (type === "blogs") {
            // change type to Blog Posting
          } else {
            // change type to News Article
          }
          const siteUrl = env.PUBLIC_SITE_URL;
          const oldUrl = `${env.SITE_URL}/${slug}`;
          const newUrl = `${siteUrl}/supply-chain-hub/pr-news/${slug}`;

          const graphString = JSON.stringify(filteredGraph);
          const replacedString = graphString.replace(
            new RegExp(oldUrl, "g"),
            newUrl,
          );
          filteredGraph = JSON.parse(replacedString);
        }

        return {
          "@context": "https://schema.org",
          "@graph": filteredGraph,
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching podcast data for Open Graph:", error);
    return null;
  }
}
