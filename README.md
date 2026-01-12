import { NextResponse } from 'next/server';
// Direct import: The best production way to handle fixed JSON in Next.js
import postsData from '@/data/posts.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Extract Query Params
    const tagQuery = searchParams.get('tag') || 'all'; 
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = 10;

    // 2. Filter Logic
    // If the user asks for 'all', we don't check the array, we take everything.
    // Otherwise, we check if the requested tag exists inside the post's tag array.
    const filteredRows = tagQuery.toLowerCase() === 'all' 
      ? postsData 
      : postsData.filter(post => 
          post.tag && Array.isArray(post.tag) && post.tag.includes(tagQuery)
        );

    // 3. Pagination Logic (The "n + 1" approach)
    const startIndex = (page - 1) * limit;
    
    // Fetch 11 items to check if there is a 12th item available for the next page
    const slice = filteredRows.slice(startIndex, startIndex + limit + 1);

    // 4. Determine pagination metadata
    const hasMore = slice.length > limit;
    const nextPage = hasMore ? page + 1 : null;
    
    // 5. Finalize rows: If we got 11 items, remove the last one before sending
    const rows = hasMore ? slice.slice(0, limit) : slice;

    return NextResponse.json({
      rows,
      hasMore,
      nextPage,
      currentPage: page
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
