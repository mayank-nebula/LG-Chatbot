async function getPodcastsInfo() {
  try {
    const sql = `SELECT title, slug, blurb, date, video_id, media_link FROM episodes_data ORDER BY date DESC`;
    const rows = await query<{ slug: string; date: string }>(sql, []);
    return rows;
  } catch (err) {
    console.error("[sitemap] Failed to fetch podcast slugs:", err);
    return [];
  }
}
