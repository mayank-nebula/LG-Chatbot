import { NextResponse } from "next/server";
import { extractHtmlStructure } from "@/lib/extractHtml";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const postUrl = `https://letstalksupplychain.com/wp-json/wp/v2/posts?slug=${slug}`;

    // Fetch post by slug
    const postRes = await fetch(postUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 }
    });

    if (!postRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch post" },
        { status: postRes.status }
      );
    }

    const posts = await postRes.json();
    if (!posts.length) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = posts[0];

    //-----------------------------------------------------
    // Extract structured HTML content
    //-----------------------------------------------------
    const html = post?.content?.rendered ?? "";
    const structuredContent = extractHtmlStructure(html);

    //-----------------------------------------------------
    // Extract comments URL (from replies link)
    //-----------------------------------------------------
    const commentsUrl = post?._links?.replies?.[0]?.href ?? null;

    //-----------------------------------------------------
    // 🔥 Fetch comments in parallel (only external call needed)
    //-----------------------------------------------------
    const comments = await fetchComments(commentsUrl);

    //-----------------------------------------------------
    // Remove `_links` & default WP content
    //-----------------------------------------------------
    const { _links, content, ...rest } = post;

    //-----------------------------------------------------
    // Final response
    //-----------------------------------------------------
    return NextResponse.json({
      ...rest,
      content: structuredContent,
      comments
    });
  } catch (error) {
    console.error("News slug API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------
// 🔧 Helper: Fetch comments safely
// -------------------------------------------------------
async function fetchComments(url: string | null) {
  if (!url) return [];

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 }
    });

    if (!res.ok) return [];

    return await res.json();
  } catch {
    return [];
  }
}
