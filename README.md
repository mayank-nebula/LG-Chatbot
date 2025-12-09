// app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAccessToken } from '@/lib/linkedin';
import axios from 'axios';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1;

  const orgId = process.env.LINKEDIN_ORG_ID;
  const pageSize = 10;

  const CACHE_KEY = `linkedin:posts:page:${page}`;
  const CACHE_TTL = 10 * 60 * 1000; // 10 min
  const now = Date.now();

  try {
    // 1. CHECK DB CACHE
    const cacheRes = await query(
      `SELECT data FROM api_cache WHERE key = $1 AND expires_at > $2`,
      [CACHE_KEY, now]
    );

    if (cacheRes.length > 0) {
      const cachedData = cacheRes[0].data;
      return NextResponse.json(cachedData);
    }

    // 2. FETCH FROM LINKEDIN
    const token = await getAccessToken();

    const start = (Math.max(1, page) - 1) * pageSize;

    const response = await axios.get("https://api.linkedin.com/rest/posts", {
      headers: {
        Authorization: `Bearer ${token}`,
        "LinkedIn-Version": "202306",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      params: {
        q: "author",
        author: `urn:li:organization:${orgId}`,
        count: pageSize,
        start: start,
        sortBy: "PUBLISHED",
      },
    });

    const resultData = {
      page,
      cached: false,
      posts: response.data.elements,
    };

    // 3. SAVE TO DB CACHE
    await query(
      `INSERT INTO api_cache (key, data, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (key)
       DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
      [CACHE_KEY, JSON.stringify(resultData), now + CACHE_TTL]
    );

    return NextResponse.json(resultData);
  } catch (error: any) {
    console.error("API Error:", error.message);

    if (error.response?.status === 401)
      return NextResponse.json({ error: "Token expired or invalid." }, { status: 401 });

    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
