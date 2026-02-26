function parseCanonical(headHtml: string, type: string): string | null {
  const canonicalMatch =
    headHtml.match(
      /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i,
    ) ??
    headHtml.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*\/?>/i,
    );

  if (!canonicalMatch?.[1]) return null;

  const rawCanonical = canonicalMatch[1];
  const escapedSiteUrl = env.SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // If canonical is on a different domain, use it as-is
  if (!new RegExp(`^${escapedSiteUrl}`).test(rawCanonical)) {
    return rawCanonical;
  }

  // Same domain — extract slug and rebuild with correct typed path
  const slugFromHref = rawCanonical
    .replace(new RegExp(`^${escapedSiteUrl}/?`), "")
    .replace(/\/+$/, "");

  const siteUrl = env.PUBLIC_SITE_URL;

  return type === "podcasts"
    ? `${siteUrl}/podcasts/${slugFromHref}`
    : type === "supply-chain-hub/women-in-supply-chain"
      ? `${siteUrl}/supply-chain-hub/women-in-supply-chain/${slugFromHref}`
      : type === "blogs"
        ? `${siteUrl}/supply-chain-hub/pr-news/${slugFromHref}`
        : `${siteUrl}/${slugFromHref}`;
}
