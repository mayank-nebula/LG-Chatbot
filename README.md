import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageMetadata {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterCard: string | null;
  robots: string | null;
}

export interface RankMathHeadData {
  graph: object | null;
  canonical: string | null;
  metadata: PageMetadata | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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

function extractMetaContent(html: string, selector: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:name|property|http-equiv)=["']${selector}["'][^>]*content=["']([^"']*)["'][^>]*\\/?>` +
      `|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property|http-equiv)=["']${selector}["'][^>]*\\/?>`,
    "i",
  );
  const match = html.match(regex);
  if (!match) return null;
  return match[1] ?? match[2] ?? null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

function replaceBaseUrl(value: string | null, escapedSiteUrl: string, publicSiteUrl: string): string | null {
  if (!value) return null;
  return value.replace(new RegExp(escapedSiteUrl, "g"), publicSiteUrl);
}

// ---------------------------------------------------------------------------
// Parsers (operate on already-fetched HTML string)
// ---------------------------------------------------------------------------

function parseGraph(headHtml: string, slug: string, type: string): object | null {
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

      const typesToReplace = ["Article", "BlogPosting", "NewsArticle", "PodcastEpisode"];

      filteredGraph.forEach((item: any) => {
        if (!item["@type"]) return;
        if (typeof item["@type"] === "string") {
          if (typesToReplace.includes(item["@type"])) item["@type"] = targetType;
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
      .replace(new RegExp(escapedSiteUrl, "g"), siteUrl);

    filteredGraph = JSON.parse(replacedString);

    return { "@context": "https://schema.org", "@graph": filteredGraph };
  }

  return null;
}

function parseCanonical(headHtml: string, type: string): string | null {
  const canonicalMatch =
    headHtml.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i) ??
    headHtml.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*\/?>/i);

  if (!canonicalMatch?.[1]) return null;

  const rawCanonical = canonicalMatch[1];
  const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const slugFromHref = rawCanonical
    .replace(new RegExp(`^${escapedSiteUrl}/?`), "")
    .replace(/\/+$/, "");

  const siteUrl = env.PUBLIC_SITE_URL;

  return type === "podcasts"
    ? `${siteUrl}/podcasts/${slugFromHref}`
    : `${siteUrl}/supply-chain-hub/pr-news/${slugFromHref}`;
}

function parseMetadata(headHtml: string): PageMetadata {
  const siteUrl = env.PUBLIC_SITE_URL;
  const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rb = (v: string | null) => replaceBaseUrl(v, escapedSiteUrl, siteUrl);

  return {
    title:              rb(extractTitle(headHtml)),
    description:        rb(extractMetaContent(headHtml, "description")),
    ogTitle:            rb(extractMetaContent(headHtml, "og:title")),
    ogDescription:      rb(extractMetaContent(headHtml, "og:description")),
    ogImage:            rb(extractMetaContent(headHtml, "og:image")),
    ogType:             extractMetaContent(headHtml, "og:type"),
    twitterTitle:       rb(extractMetaContent(headHtml, "twitter:title")),
    twitterDescription: rb(extractMetaContent(headHtml, "twitter:description")),
    twitterImage:       rb(extractMetaContent(headHtml, "twitter:image")),
    twitterCard:        extractMetaContent(headHtml, "twitter:card"),
    robots:             extractMetaContent(headHtml, "robots"),
  };
}

// ---------------------------------------------------------------------------
// Public API — single fetch, pick what you need
// ---------------------------------------------------------------------------

export async function getRankMathHead(
  slug: string,
  type: string,
  options: { graph?: boolean; canonical?: boolean; metadata?: boolean } = {
    graph: true,
    canonical: true,
    metadata: true,
  },
): Promise<RankMathHeadData | null> {
  try {
    const url = `${env.SITE_URL}/wp-json/rankmath/v1/getHead?url=${env.SITE_URL}/${slug}`;
    const res = await safeFetchJSON(url);

    if (!res?.head) return null;

    const headHtml: string = res.head;

    return {
      graph:     options.graph     ? parseGraph(headHtml, slug, type)  : null,
      canonical: options.canonical ? parseCanonical(headHtml, type)    : null,
      metadata:  options.metadata  ? parseMetadata(headHtml)           : null,
    };
  } catch (error) {
    console.error("Error fetching RankMath head data:", error);
    return null;
  }
}
