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

    let headHtml: string | null = null;

    // Try RankMath JSON endpoint first, fall back to direct page fetch if it
    // throws (e.g. when RankMath returns a raw HTML page instead of JSON)
    try {
      const res = await safeFetchJSON(url);
      if (res?.head) headHtml = res.head;
    } catch {
      const rawRes = await fetch(`${env.SITE_URL}/${slug}`);
      if (!rawRes.ok) return null;
      headHtml = await rawRes.text();
    }

    if (!headHtml) return null;

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
