import { NextResponse } from "next/server";

//
// ------------------------------
// Config
// ------------------------------
//

// WordPress API base
const WP_BASE = "https://letstalksupplychain.com/wp-json/wp/v2";

// Static mock search strings (replace with DB later)
const SEARCH_STRINGS = [
  "504: Discover the Recipe for Best-in-Class Transformation, with EyeOn",
];

// Timeout wrapper for fetch
function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 15000) {
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

//
// ------------------------------
// Helpers
// ------------------------------
//

function extractLibsynUrl(html: string): string | null {
  const match = html.match(/<iframe[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
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
  const url = `${WP_BASE}/posts?search=${encodeURIComponent(searchText)}&per_page=1`;
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

    // 2. Extract Libsyn
    const libsynUrl = extractLibsynUrl(post.content?.rendered || "");

    // 3. Fetch Media
    const mediaUrl = `${WP_BASE}/media?parent=${postId}`;
    const mediaItems = await safeFetchJSON(mediaUrl);

    const mediaGuids = mediaItems?.[0]?.guid?.rendered ?? null;

    return {
      search_string: searchText,
      post_id: postId,
      title: post.title?.rendered ?? "",
      libsyn_url: libsynUrl,
      media_guid: mediaGuids,
    };
  } catch (err: any) {
    return { error: err.message || "Unknown error", search_string: searchText };
  }
}

//
// ------------------------------
// Route Handler
// ------------------------------
//

export async function GET() {
  const start = Date.now();

  try {
    // Run all searches in parallel
    const results = await Promise.all(
      SEARCH_STRINGS.map((s) => processSinglePost(s))
    );

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    return NextResponse.json({
      ok: true,
      results,
      elapsed_seconds: elapsed,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
