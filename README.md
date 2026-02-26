import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";

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

function extractMetaContent(html: string, selector: string): string | null {
  // Matches both name/property/http-equiv variants
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

function replaceBaseUrl(value: string | null, siteUrl: string): string | null {
  if (!value) return null;
  const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const globalSiteUrlRegex = new RegExp(escapedSiteUrl, "g");
  return value.replace(globalSiteUrlRegex, siteUrl);
}

export async function getPageMetadata(pageUrl: string): Promise<PageMetadata | null> {
  try {
    const url = `${env.SITE_URL}/wp-json/rankmath/v1/getHead?url=${pageUrl}`;
    const res = await safeFetchJSON(url);

    if (!res || !res.head) return null;

    const headHtml: string = res.head;
    const siteUrl = env.PUBLIC_SITE_URL;

    const raw: PageMetadata = {
      title:            extractTitle(headHtml),
      description:      extractMetaContent(headHtml, "description"),
      ogTitle:          extractMetaContent(headHtml, "og:title"),
      ogDescription:    extractMetaContent(headHtml, "og:description"),
      ogImage:          extractMetaContent(headHtml, "og:image"),
      ogType:           extractMetaContent(headHtml, "og:type"),
      twitterTitle:     extractMetaContent(headHtml, "twitter:title"),
      twitterDescription: extractMetaContent(headHtml, "twitter:description"),
      twitterImage:     extractMetaContent(headHtml, "twitter:image"),
      twitterCard:      extractMetaContent(headHtml, "twitter:card"),
      robots:           extractMetaContent(headHtml, "robots"),
    };

    // Replace internal SITE_URL with PUBLIC_SITE_URL across all fields
    const metadata: PageMetadata = {
      title:              replaceBaseUrl(raw.title, siteUrl),
      description:        replaceBaseUrl(raw.description, siteUrl),
      ogTitle:            replaceBaseUrl(raw.ogTitle, siteUrl),
      ogDescription:      replaceBaseUrl(raw.ogDescription, siteUrl),
      ogImage:            replaceBaseUrl(raw.ogImage, siteUrl),
      ogType:             raw.ogType,
      twitterTitle:       replaceBaseUrl(raw.twitterTitle, siteUrl),
      twitterDescription: replaceBaseUrl(raw.twitterDescription, siteUrl),
      twitterImage:       replaceBaseUrl(raw.twitterImage, siteUrl),
      twitterCard:        raw.twitterCard,
      robots:             raw.robots,
    };

    return metadata;
  } catch (error) {
    console.error("Error fetching page metadata:", error);
    return null;
  }
}
