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

const staticVideos: Video[] = [
  {
    title: "366: Blended – Leveling The Playing Field: What Women Have To Think About Vs Men",
    description: "This podcast discusses the daily and workplace differences between men and women due to societal expectations, bias, and stereotypes, aiming to create safe spaces for all genders.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-366-blended-levelling-the-playing-field-what-women-have-to-think-about-vs-men",
    uploadDate: "2023-10-18T20:47:58Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/11/Blended-Audiogram_Episode-38.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/10/Blended-Graphic-w-Guests_Episode-37.png",
  },
  {
    title: "375 &#8211; Blended: &#8216;Did They Just Say That?&#8217; The Truth About Microaggression",
    description: "Blended S38 panel defines microaggressions (subtle insults impacting diverse groups), shares experiences, and discusses identifying & tackling them to foster diversity, equity, and inclusion.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-375-blended-did-they-just-say-that-the-truth-about-microaggression",
    uploadDate: "2023-11-15T19:18:05Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/11/Blended-Audiogram_Episode-38.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/11/Blended-IG-Graphic_Episode-38-2.png",
  },
  {
    title: "381 – Blended: Don't Cancel Us! Calling out Cancel Culture",
    description: "Episode 39 of Blended discusses cancel culture: its evolution, weaponization by social media & politics, workplace impact, and fostering positive cultures.",
    pageUrl: "https://letstalksupplychain.com/podcasts/381-blended-dont-cancel-us-calling-out-cancel-culture",
    uploadDate: "2023-12-20T07:00:07Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/12/audio1763936783_uVVaL80W-Made-by-Headliner.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/12/Blended-39_website-graphic-square.png",
  },
  {
    title: "386 &#8211; Blended: Let&#8217;s Change The World! Organizations Doing Good Now",
    description: "Blended explores organizations making a positive global impact. Discussions cover corporate responsibility vs. personal accountability, balancing people/profit, and driving change for good.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-386-blended-lets-change-the-world-organizations-doing-good-now",
    uploadDate: "2024-01-17T22:02:24Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2024/01/ltsc-blended-40v2-mixed-and-mastered_kFlK46BZ-Made-by-Headliner.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2024/01/Blended-40_website-graphic-450x302-1.png",
  },
  {
    title: "397 – Blended: What We Need To Know About Bias",
    description: "Blended explores bias: its origins, impact, and how to address it personally and professionally. Panelists share experiences and strategies for confronting bias.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-397-blended-what-we-need-to-know-about-bias",
    uploadDate: "2024-03-20T20:15:56Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2024/03/Blended-42-Audiogram.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2024/03/Blended-42_website-graphic-450x302-1.png",
  },
  {
    title: "323: Blended &#8211;  How to Foster an Inclusive Workplace",
    description: "Blended Ep. 29 explores creating inclusive workplaces: benefits, challenges like bias, and practical steps for a respectful, equitable environment for all.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-323-blended-how-to-foster-an-inclusive-workplace",
    uploadDate: "2023-02-15T04:15:32Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/02/Blended-Episode-29.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/02/Episode-29-Graphic-with-Guests-01.png",
  },
  {
    title: "361: Blended &#8211; Trauma, Allyship and Pity: Understanding Victimhood",
    description: "Blended S36 explores victimhood with guests, discussing diverse experiences, impacts, weaponization, gatekeeping, and pity to foster understanding & support.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-361-blended-trauma-allyship-and-pity-understanding-victimhood",
    uploadDate: "2023-09-20T17:24:46Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/09/Blended-Episode-36.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/09/Episode-36-Graphic-with-Guests.png",
  },
  {
    title: "318: Blended &#8211; Parenthood vs a Career: The Ultimate Catch 22",
    description: "Blended Ep 28 tackles balancing parenthood & career, advocating for better workplace support, flexibility, & parental rights to improve work-life balance.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode318-blended-parenthood-vs-a-career-the-ultimate-catch-22",
    uploadDate: "2023-01-19T06:12:34Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/01/Blended-Episode-28.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2023/01/parenthood.png",
  },
  {
    title: "392 &#8211; Blended: Preference vs Bias: What's The Difference?",
    description: "Blended episode 41 explores the complex line between preference and bias. It defines both, discusses identifying bias, its impact, and strategies for tackling it.",
    pageUrl: "https://letstalksupplychain.com/podcasts/episode-392-blended-preference-vs-bias-whats-the-difference",
    uploadDate: "2024-02-21T23:04:51Z",
    youtubeId: null,
    mp4Url: "https://wp.letstalksupplychain.com/wp-content/uploads/2024/02/audio1074993897_PR7g7DSK-Made-by-Headliner.mp4",
    featuredMediaUrl: "https://wp.letstalksupplychain.com/wp-content/uploads/2024/02/Blended-41_website-graphic-450x302-1.png",
  },
];

async function getPodcastsInfo(): Promise<Video[]> {
  try {
    const sql = `SELECT title, slug, blurb, date, video_id, media_link
                 FROM episodes_data
                 WHERE video_id IS NOT NULL
                 ORDER BY date DESC`;
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
  const dbVideos = await getPodcastsInfo();
  const videos: Video[] = [...staticVideos, ...dbVideos];

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
