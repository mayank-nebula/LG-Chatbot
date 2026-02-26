import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";

export async function getPageCanonical(slug: string, type: string) {
  try {
    const url = `${env.SITE_URL}/wp-json/rankmath/v1/getHead?url=${env.SITE_URL}/${slug}`;
    const res = await safeFetchJSON(url);

    if (!res || !res.head) return null;

    const headHtml: string = res.head;

    const canonicalMatch = headHtml.match(
      /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i,
    ) ?? headHtml.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*\/?>/i,
    );

    if (!canonicalMatch || !canonicalMatch[1]) return null;

    const rawCanonical = canonicalMatch[1];

    // Extract the slug from the canonical href returned by RankMath.
    // e.g. "https://old-domain.com/real-slug/" → "real-slug"
    const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const slugFromHref = rawCanonical
      .replace(new RegExp(`^${escapedSiteUrl}/?`), "") // strip base domain
      .replace(/\/+$/, "");                             // strip trailing slash

    const siteUrl = env.PUBLIC_SITE_URL;

    const canonical =
      type === "podcasts"
        ? `${siteUrl}/podcasts/${slugFromHref}`
        : `${siteUrl}/supply-chain-hub/pr-news/${slugFromHref}`;

    return canonical;
  } catch (error) {
    console.error("Error fetching canonical data:", error);
    return null;
  }
}
