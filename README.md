import { NextResponse } from "next/server";

const BASE_URL =
  "https://letstalksupplychain.com/wp-json/wp/v2/posts?categories=8315&categories_exclude=5388";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const per_page = 10;

    const url = `${BASE_URL}&per_page=${per_page}&page=${page}`;

    // Fetch posts (cached)
    const postsRes = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }, // edge caching
    });

    if (!postsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: postsRes.status }
      );
    }

    const posts = await postsRes.json();

    const totalPagesHeader = postsRes.headers.get("X-WP-TotalPages");
    const totalPages = totalPagesHeader ? Number(totalPagesHeader) : 0;

    // Determine next page
    const hasNext =
      totalPages > 0 ? page < totalPages : posts.length === per_page;

    // ---------------------------------------
    // 🔥 Fetch featured media in parallel
    // ---------------------------------------
    const postsWithMedia = await Promise.all(
      posts.map(async (post: any) => {
        const mediaLink =
          post?._links?.["wp:featuredmedia"]?.[0]?.href ?? null;

        if (!mediaLink) {
          return { ...post, featured_image: null };
        }

        try {
          const mediaRes = await fetch(mediaLink, {
            headers: { Accept: "application/json" },
            next: { revalidate: 120 }, // media rarely changes
          });

          if (!mediaRes.ok) {
            return { ...post, featured_image: null };
          }

          const media = await mediaRes.json();

          const mediaUrl =
            media?.source_url ||
            media?.media_details?.sizes?.medium?.source_url ||
            null;

          return {
            ...post,
            featured_image: mediaUrl,
          };
        } catch {
          return { ...post, featured_image: null };
        }
      })
    );

    return NextResponse.json({
      posts: postsWithMedia,
      pagination: {
        page,
        per_page,
        has_next: hasNext,
        next_page: hasNext ? page + 1 : null,
        source: totalPages > 0 ? "headers" : "fallback",
      },
    });
  } catch (error) {
    console.error("LTSS API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
