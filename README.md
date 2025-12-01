// middleware.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

const COOKIE_NAME = "anon_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function middleware(req) {
  const existing = req.cookies.get(COOKIE_NAME);

  if (existing) return NextResponse.next();

  const newId = crypto.randomUUID();

  const res = NextResponse.next();
  res.cookies.set({
    name: COOKIE_NAME,
    value: newId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return res;
}

export const config = {
  matcher: "/:path*",
};




// lib/session.ts
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "anon_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function ensureSession() {
  const store = cookies();
  const existing = store.get(COOKIE_NAME)?.value;

  if (existing) return existing;

  const id = crypto.randomUUID();

  store.set({
    name: COOKIE_NAME,
    value: id,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return id;
}

export function getSession() {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}




// lib/db.ts
import { createClient } from "@google-cloud/alloydb";

declare global {
  // prevents multiple client instances during hot reloads
  var _alloydbClient: any | undefined;
}

function initClient() {
  return createClient({
    instancePath: process.env.ALLOYDB_INSTANCE_PATH!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  });
}

export const db = global._alloydbClient || initClient();

if (!global._alloydbClient) {
  global._alloydbClient = db;
}

export async function query<T = any>(sql: string, params?: any[]) {
  const pool = await db.getPool();   // created ONCE and reused
  const res = await pool.query<T>(sql, params);
  return res.rows;
}



// lib/youtube.ts

const MAP: Record<string, string> = {
  "tpm-today": "PLAYLIST_ID_1",
  "abc": "PLAYLIST_ID_2",
};

export function resolvePlaylist(keyword: string) {
  return MAP[keyword] ?? null;
}

export async function fetchPlaylistVideos(
  playlistId: string,
  pageToken?: string,
  limit: number = 10
) {
  const key = process.env.YOUTUBE_API_KEY!;

  let url =
    "https://www.googleapis.com/youtube/v3/playlistItems" +
    `?part=snippet&maxResults=${limit}&playlistId=${playlistId}&key=${key}`;

  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("YouTube API error");

  const data = await res.json();

  return {
    items: data.items.map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
}

// app/api/videos/route.ts
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


