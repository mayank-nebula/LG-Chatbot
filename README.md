import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CATEGORY_GROUPS } from "@/lib/categories"; // Import your map

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursorParam = searchParams.get("page") ?? "1";
    const groupSlug = searchParams.get("category"); // e.g., "tech-and-info"
    
    const cursor = Math.max(1, parseInt(cursorParam, 10));
    const pageSize = 10;
    const offset = (cursor - 1) * pageSize;

    let sql = `SELECT title, slug, date, video_id, media_link, categories FROM episodes_data`;
    const queryValues: any[] = [];

    // --- LOGIC FOR FILTERING GROUPS ---
    if (groupSlug && CATEGORY_GROUPS[groupSlug]) {
      const categoryIds = CATEGORY_GROUPS[groupSlug]; // [5340, 5928]
      
      // SQL Overlap Operator (&&) checks if two arrays have any elements in common
      // We cast the input to an integer array: $1::int[]
      sql += ` WHERE categories && $1::int[] `;
      queryValues.push(categoryIds);
    }

    const argIdx = queryValues.length;
    sql += ` ORDER BY date DESC LIMIT $${argIdx + 1} OFFSET $${argIdx + 2}`;
    queryValues.push(pageSize + 1, offset);

    const rows = await query<any>(sql, queryValues);

    const hasMore = rows.length > pageSize;
    const paginatedRows = rows.slice(0, pageSize);

    return NextResponse.json({ ok: true, rows: paginatedRows, hasMore });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
