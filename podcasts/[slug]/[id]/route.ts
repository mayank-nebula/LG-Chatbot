import { NextResponse } from "next/server";

import { query } from "@/lib/db";
import { extractHtmlStructure } from "@/lib/extractHtml";

const WP_BASE = process.env.WP_BASE;

function extractLibsynUrl(html: string): string | null {
  const match = html.match(/<iframe[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

// Timeout wrapper for fetch
function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15000
) {
  return new Promise<Response>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("Request timeout")), timeout);
    fetch(url, options)
      .then((res) => {
        clearTimeout(id);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });
}

// Fetch JSON with error safety
async function safeFetchJSON(url: string) {
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}): ${url}`);
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Non-JSON response from:", url);
    console.error("Response preview:", text.slice(0, 300));
    throw new Error("Invalid JSON response");
  }
}

async function fetchPostBySlug(searchText: string) {
  const url = `${WP_BASE}/posts?slug=${searchText}&per_page=1&_fields=id,slug,title,content`;
  const posts = await safeFetchJSON(url);
  return posts?.[0] ?? null;
}

// Fetch a post by slug
async function processSinglePost(slug: string) {
  try {
    // 1. Search
    const post = await fetchPostBySlug(slug);
    if (!post) {
      return { error: `No post found for slug: ${slug}` };
    }

    // 2. Fetch Media
    const mediaUrl = `${WP_BASE}/media?parent=${post.id}`;
    const mediaItems = await safeFetchJSON(mediaUrl);

    const mediaGuids = mediaItems?.[0]?.guid?.rendered ?? null;

    return {
      post_id: post.id,
      title: post.title?.rendered ?? "",
      slug: post.slug,
      media_guid: mediaGuids,
      libsynUrl: extractLibsynUrl(post.content?.rendered ?? ""),
      content: extractHtmlStructure(post.content?.rendered ?? ""),
    };
  } catch (err: any) {
    return { error: err.message || "Unknown error", search_string: slug };
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await context.params;
  const videoId = id;

  try {
    const queryString = `
    SELECT *
    FROM table
    WHERE video_id = $1
    `;

    const rows = await query<any>(queryString, [videoId]);
    const dbRow = rows[0] ?? null;

    if (!dbRow) {
      return NextResponse.json(
        {
          error: `No database record found for video_id ${videoId}`,
        },
        { status: 404 }
      );
    }

    const wpData = await processSinglePost(slug);
    return NextResponse.json({ ok: true, wp: wpData, db: dbRow });
  } catch (error) {
    console.error("Podcast API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
