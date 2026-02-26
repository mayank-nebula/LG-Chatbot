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

    const siteUrl = env.PUBLIC_SITE_URL;

    const newCanonical =
      type === "podcasts"
        ? `${siteUrl}/podcasts/${slug}`
        : `${siteUrl}/supply-chain-hub/pr-news/${slug}`;

    // Replace the old SITE_URL base with the public site URL, then override
    // the full slug-specific URL with the correctly-typed canonical.
    const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const globalSiteUrlRegex = new RegExp(escapedSiteUrl, "g");

    const withPublicBase = rawCanonical.replace(globalSiteUrlRegex, siteUrl);

    // If the URL already points at the slug just swap in the typed path,
    // otherwise trust the public-base-replaced value.
    const canonical = withPublicBase.includes(slug)
      ? newCanonical
      : withPublicBase;

    return canonical;
  } catch (error) {
    console.error("Error fetching canonical data:", error);
    return null;
  }
}
