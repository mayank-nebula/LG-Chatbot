import { NextResponse } from "next/server";

import { resolvePlaylist, fetchPlaylistVideos } from "@/lib/youtube";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const keyword = searchParams.get("t");
  const pageToken = searchParams.get("pageToken") || undefined;

  if (!keyword) {
    return NextResponse.json({ error: "Missing keyword" }, { status: 400 });
  }

  const playlistId = resolvePlaylist(keyword);
  if (!playlistId) {
    return NextResponse.json({ error: "Unknown keyword" }, { status: 404 });
  }

  const { items, nextPageToken } = await fetchPlaylistVideos(
    playlistId,
    pageToken,
    10
  );

  return NextResponse.json({
    items,
    nextPageToken,
    hasMore: nextPageToken !== null,
  });
}
