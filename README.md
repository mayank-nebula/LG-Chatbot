import { NextResponse } from 'next/server';
// Import JSON directly for best production performance in Next.js
import postsData from '@/data/posts.json'; 

// 1. Pre-sort the data (Latest to Oldest) once at the module level
const sortedPosts = [...postsData].sort((a, b) => 
  new Date(b.date).getTime() - new Date(a.date).getTime()
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Params
    const tag = searchParams.get('tag') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 10;

    // 2. Filter by tag
    const filtered = sortedPosts.filter((post) => {
      if (tag === 'all') return true;
      return post.tag.includes(tag);
    });

    // 3. Pagination Logic: Fetch "limit + 1" (11 items)
    const startIndex = (page - 1) * limit;
    const fetchCount = limit + 1; 
    const slice = filtered.slice(startIndex, startIndex + fetchCount);

    // 4. Determine if there is a next page
    const hasMore = slice.length > limit;
    
    // 5. Final rows: If we found 11, return only the first 10
    const rows = hasMore ? slice.slice(0, limit) : slice;
    const nextPage = hasMore ? page + 1 : null;

    // Response structure as requested
    return NextResponse.json({
      rows,
      hasMore,
      nextPage,
      currentPage: page
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
