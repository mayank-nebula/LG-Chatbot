async function getPodcastsFromWebContent(): Promise<Video[]> {
  try {
    const sql = `SELECT title, slug, blurb, date, media_link, web_content
                 FROM episodes_data
                 WHERE video_id IS NULL AND web_content IS NOT NULL
                 ORDER BY date DESC`;
    const rows = await query<PodcastContentRow>(sql, []);

    const results: Video[] = [];

    for (const row of rows) {
      if (!row.web_content) continue;

      // Match all iframes containing youtube.com/embed/
      const iframeRegex = /<iframe[^>]+src=["'][^"']*youtube\.com\/embed\/([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>/gi;
      const match = iframeRegex.exec(row.web_content);

      if (!match) continue;

      const youtubeId = match[1];

      results.push({
        title: row.title,
        description: row.blurb,
        pageUrl: `https://letstalksupplychain.com/podcasts/${row.slug}`,
        uploadDate: row.date,
        youtubeId,
        mp4Url: null,
        featuredMediaUrl:
          row.media_link?.replace(
            /https:\/\/letstalksupplychain\.com/g,
            "https://wp.letstalksupplychain.com"
          ) ?? "",
      });
    }

    return results;
  } catch (err) {
    console.error("[sitemap] Failed to fetch podcasts from web_content:", err);
    return [];
  }
}
