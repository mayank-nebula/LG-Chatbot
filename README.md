import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CATEGORY_GROUPS } from "@/lib/categories";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursorParam = searchParams.get("page") ?? "1";
    const groupSlug = searchParams.get("category"); 
    
    const cursor = Math.max(1, parseInt(cursorParam, 10));
    const pageSize = 10;
    const offset = (cursor - 1) * pageSize;

    let sql = `SELECT title, slug, date, video_id, media_link, categories FROM episodes_data`;
    const queryValues: any[] = [];
    let whereConditions: string[] = [];

    // --- LOGIC FOR JSONB FILTERING ---
    if (groupSlug && CATEGORY_GROUPS[groupSlug]) {
      const categoryIds = CATEGORY_GROUPS[groupSlug]; // [5340, 5928]
      
      // We build: (categories @> '$1' OR categories @> '$2')
      // Note: For JSONB arrays, we check if it contains the individual ID
      const orConditions = categoryIds.map((id) => {
        queryValues.push(JSON.stringify(id)); // Store as JSON string/number
        return `categories @> $${queryValues.length}::jsonb`;
      });

      if (orConditions.length > 0) {
        whereConditions.push(`(${orConditions.join(" OR ")})`);
      }
    }

    // Apply WHERE clause if conditions exist
    if (whereConditions.length > 0) {
      sql += ` WHERE ` + whereConditions.join(" AND ");
    }

    // Add Ordering and Pagination
    const argIdx = queryValues.length;
    sql += ` ORDER BY date DESC LIMIT $${argIdx + 1} OFFSET $${argIdx + 2}`;
    queryValues.push(pageSize + 1, offset);

    const rows = await query<any>(sql, queryValues);

    const hasMore = rows.length > pageSize;
    const paginatedRows = rows.slice(0, pageSize);

    return NextResponse.json({ ok: true, rows: paginatedRows, hasMore });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
