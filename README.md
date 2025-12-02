import { NextResponse } from "next/server";

import { query } from "@/lib/db";

// function extractLibsynUrl(html: string): string | null {
//   const match = html.match(/<iframe[^>]+src="([^"]+)"/);
//   return match ? match[1] : null;
// }

// WordPress API base
const WP_BASE = process.env.WP_BASE;

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

// Fetch a post by text
async function fetchPostBySearch(searchText: string) {
  const url = `${WP_BASE}/posts?search=${encodeURIComponent(
    searchText
  )}&per_page=1&_fields=id,slug,title`;
  const posts = await safeFetchJSON(url);
  return posts?.[0] ?? null;
}

async function processSinglePost(searchText: string) {
  try {
    // 1. Search
    const post = await fetchPostBySearch(searchText);
    if (!post) {
      return { error: `No post found for search: ${searchText}` };
    }

    const postId = post.id;

    // 2. Fetch Media
    const mediaUrl = `${WP_BASE}/media?parent=${postId}`;
    const mediaItems = await safeFetchJSON(mediaUrl);

    const mediaGuids = mediaItems?.[0]?.guid?.rendered ?? null;

    return {
      post_id: postId,
      title: post.title?.rendered ?? "",
      slug: post.slug,
      media_guid: mediaGuids,
    };
  } catch (err: any) {
    return { error: err.message || "Unknown error", search_string: searchText };
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const curosrParam = searchParams.get("curosr") ?? "1";
  const curosr = Math.max(1, parseInt(curosrParam, 10));

  const pageSize = 10;
  const offset = (curosr - 1) * pageSize;
  try {
    // Fix Query
    const queryString = `
    SELECT title
    FROM table
    ORDER BY id ASC
    LIMIT $1 OFFSET $2
    `;

    const rows = await query<{ title: string }>(queryString, [
      pageSize,
      offset,
    ]);
    const searchStrings = rows.map((r) => r.title);

    // Run all searches in parallel
    const results = await Promise.all(
      searchStrings.map((s) => processSinglePost(s))
    );

    return NextResponse.json({
      ok: true,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
