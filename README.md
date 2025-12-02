import { NextResponse } from "next/server";

const BASE_URL =
  "https://letstalksupplychain.com/wp-json/wp/v2/posts?categories=8315&categories_exclude=5388";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Read page from query
    const pageParam = searchParams.get("page");
    const page = pageParam ? Math.max(1, Number(pageParam)) : 1;

    // Per page fixed as requested
    const per_page = 10;

    // Build target API URL
    const url = `${BASE_URL}&per_page=${per_page}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store", // ensure fresh results
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: response.status }
      );
    }

    const posts = await response.json();

    // Try pagination headers (browser sees them, Postman may not)
    const totalPagesHeader = response.headers.get("X-WP-TotalPages");
    const totalPages = totalPagesHeader ? Number(totalPagesHeader) : 0;

    // Determine next page
    let hasNext = false;

    if (totalPages > 0) {
      // Header-based detection (most accurate)
      hasNext = page < totalPages;
    } else {
      // Fallback if headers missing: length check
      hasNext = Array.isArray(posts) && posts.length === per_page;
    }

    return NextResponse.json({
      posts,
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
