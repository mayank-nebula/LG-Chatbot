import { NextResponse } from "next/server";

import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursorParam = searchParams.get("page") ?? "1";
    const cursor = Math.max(1, parseInt(cursorParam, 10));
    const pageSize = 10;
    const offset = (cursor - 1) * pageSize;

    const sql = `
      SELECT title, slug, date, video_id, media_link 
      FROM episodes_data
      ORDER BY date DESC
      LIMIT $1 OFFSET $2
    `;

    const rows = await query<{
      title: string;
      slug: string;
      date: string;
      video_id: string;
      media_link: string;
    }>(sql, [pageSize + 1, offset]);

    const hasMore = rows.length > pageSize;
    const paginatedRows = rows.slice(0, pageSize);

    return NextResponse.json({ ok: true, rows: paginatedRows, hasMore });
  } catch (err: any) {
    console.error("Podcasts list error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
