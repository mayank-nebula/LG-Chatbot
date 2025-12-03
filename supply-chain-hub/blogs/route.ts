import { NextResponse } from "next/server";

const ALL_CATEGORIES = [
  5710, 5885, 5458, 5430, 6163, 5687, 6550, 5446, 5528, 5745, 5702, 6317, 5596,
  6172, 5747, 5632, 5468, 7204, 6996, 6922, 6974, 6167, 6761, 6742, 6601, 7200,
  7201, 7366, 7203, 7202, 7553, 7969, 6951, 6932, 5387, 6168, 5388, 5389, 5589,
  5502, 7573, 6197, 6435, 5409, 6487, 5773, 6478, 7205, 5763, 6489, 6000, 7015,
  6423, 5429, 6930, 7014, 5653, 1, 6174, 5787, 6504, 6086, 5345, 5347, 6506,
  7016, 5515,
];

const TARGET_CATEGORIES = [8315, 8424];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const per_page = 10;

    const exclude = ALL_CATEGORIES.filter(
      (id) => !TARGET_CATEGORIES.includes(id)
    );

    const url = `https://letstalksupplychain.com/wp-json/wp/v2/posts?categories=${TARGET_CATEGORIES.join(
      "&categories="
    )}&categories_exclude=${exclude.join(
      ","
    )}&per_page=${per_page}&page=${page}&_fields=id,title,slug,_links`;

    // Fetch posts (cached)
    const postsRes = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
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

    const processedPosts = await Promise.all(
      posts.map(async (post: any) => {
        const mediaUrl = post?._links?.["wp:featuredmedia"]?.[0]?.href;

        let featured_image = null;

        if (mediaUrl) {
          try {
            const mediaRes = await fetch(mediaUrl, {
              headers: { Accept: "application/json" },
              next: { revalidate: 120 },
            });

            if (mediaRes.ok) {
              const media = await mediaRes.json();
              featured_image =
                media?.source_url ||
                media?.media_details?.sizes?.medium?.source_url ||
                null;
            }
          } catch {
            featured_image = null;
          }
        }

        // Return post with everything except _links
        const { _links, ...rest } = post;

        return {
          ...rest,
          featured_image,
        };
      })
    );

    return NextResponse.json({
      posts: processedPosts,
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
