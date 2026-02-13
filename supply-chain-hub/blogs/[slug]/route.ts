import { NextResponse } from "next/server";
import { extractHtmlStructure } from "@/lib/extractHtml";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const postUrl = `https://letstalksupplychain.com/wp-json/wp/v2/posts?slug=${slug}&_fields=id,title,content,_links`;

    // Fetch post by slug
    const postRes = await fetch(postUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!postRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch post" },
        { status: postRes.status }
      );
    }

    const posts = await postRes.json();
    if (!posts.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = posts[0];

    const html = post?.content?.rendered ?? "";
    const structuredContent = extractHtmlStructure(html);

    const rawCommentsUrl = post?._links?.replies?.[0]?.href ?? null;
    const commentsUrl = rawCommentsUrl
      ? `${rawCommentsUrl}&_fields=id,author_name,content`
      : null;

    const comments = await fetchComments(commentsUrl);

    const { _links, content, ...rest } = post;

    return NextResponse.json({
      ...rest,
      content: structuredContent,
      comments,
    });
  } catch (error) {
    console.error("News slug API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function fetchComments(url: string | null) {
  if (!url) return [];

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });

    if (!res.ok) return [];

    const comments = await res.json();

    return comments.map((c: any) => ({
      id: c.id,
      author_name: c.author_name,
      content: extractHtmlStructure(c?.content?.rendered ?? ""),
    }));
  } catch {
    return [];
  }
}
