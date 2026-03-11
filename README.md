import { NextResponse } from "next/server";
import { query } from "@/lib/db"; // adjust path as needed

interface PodcastRow {
  title: string;
  slug: string;
  blurb: string;
  date: string;
  video_id: string | null;
  media_link: string | null;
}

interface Video {
  title: string;
  description: string;
  pageUrl: string;
  uploadDate: string;
  youtubeId: string | null;
  mp4Url: string | null;
  featuredMediaUrl: string;
}

async function getPodcastsInfo(): Promise<Video[]> {
  try {
    const sql = `SELECT title, slug, blurb, date, video_id, media_link FROM episodes_data ORDER BY date DESC`;
    const rows = await query<PodcastRow>(sql, []);

    return rows.map((row) => ({
      title: row.title,
      description: row.blurb,
      pageUrl: `https://letstalksupplychain.com/podcasts/${row.slug}`,
      uploadDate: row.date,
      youtubeId: row.video_id ?? null,
      mp4Url: null,
      featuredMediaUrl:
        row.media_link?.replace(
          /https:\/\/letstalksupplychain\.com/g,
          "https://wp.letstalksupplychain.com"
        ) ?? "",
    }));
  } catch (err) {
    console.error("[sitemap] Failed to fetch podcast slugs:", err);
    return [];
  }
}

export async function GET() {
  const videos = await getPodcastsInfo();

  const videoEntries = videos
    .map((video): string => {
      let thumbnailUrl: string;
      let videoLocationTag: string;

      if (video.youtubeId) {
        thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`;
        videoLocationTag = `<video:player_loc>https://www.youtube.com/embed/${video.youtubeId}</video:player_loc>`;
      } else if (video.mp4Url) {
        thumbnailUrl = video.featuredMediaUrl;
        videoLocationTag = `<video:content_loc><![CDATA[${video.mp4Url}]]></video:content_loc>`;
      } else {
        return "";
      }

      return `
    <url>
      <loc><![CDATA[${video.pageUrl}]]></loc>
      <video:video>
        <video:thumbnail_loc><![CDATA[${thumbnailUrl}]]></video:thumbnail_loc>
        <video:title><![CDATA[${video.title}]]></video:title>
        <video:description><![CDATA[${video.description}]]></video:description>
        <video:publication_date>${video.uploadDate}</video:publication_date>
        ${videoLocationTag}
      </video:video>
    </url>`;
    })
    .join("");

  const xml: string = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${videoEntries}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
