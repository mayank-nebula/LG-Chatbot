Great — below is a complete, production-ready project layout with full code for every file you asked for. I kept your existing `extractHtmlStructure` as a placeholder (no DOM parser changes). Files are strongly typed, commented, and organized for maintainability.

> Note: paths use `src/` and Next.js App Router conventions. Replace `src` with your project root if different.

---

# Project tree (recommended)

```
src/
├─ app/
│  └─ api/
│     ├─ chat/
│     │  └─ route.ts
│     ├─ events/
│     │  └─ route.ts
│     ├─ watch/
│     │  └─ route.ts
│     ├─ podcasts/
│     │  ├─ route.ts
│     │  └─ [slug]/
│     │     └─ [id]/
│     │        └─ route.ts
│     └─ health/
│        └─ route.ts
├─ lib/
│  ├─ env.ts
│  ├─ fetch.ts
│  ├─ db.ts
│  ├─ youtube.ts
│  ├─ wordpress.ts
│  ├─ html/
│  │  └─ extractHtml.ts
│  └─ schemas/
│     └─ chatRequest.ts
├─ types/
│  ├─ index.ts
│  ├─ youtube.ts
│  ├─ wordpress.ts
│  ├─ podcast.ts
│  └─ chat.ts
├─ package.json
└─ README.md

.env.example
```

---

Below are the **contents of every file**. Copy / paste into your repo.

---

## `src/lib/env.ts`

```ts
/**
 * Centralized environment access and validation.
 * Keep this file minimal — it makes it easy to mock env values in tests.
 */

export const env = {
  PRIVATE_STREAM_URL: process.env.PRIVATE_STREAM_URL ?? "",
  PRIVATE_API_KEY: process.env.PRIVATE_API_KEY ?? "",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ?? "",
  YOUTUBE_CHANNEL_ID:
    process.env.YOUTUBE_CHANNEL_ID ?? "UCjjcxxsvx5sDR0F33ciy1QQ",
  WP_BASE: process.env.WP_BASE ?? "",
  DB_HOST: process.env.DB_HOST ?? "127.0.0.1",
  DB_PORT: Number(process.env.DB_PORT ?? 5432),
  DB_USER: process.env.DB_USER ?? "",
  DB_PASSWORD: process.env.DB_PASSWORD ?? "",
  DB_NAME: process.env.DB_NAME ?? "",
};
```

---

## `src/lib/fetch.ts`

```ts
/**
 * Simple fetch helpers:
 * - fetchWithTimeout: wraps fetch with a timeout
 * - safeFetchJSON: fetch and assert JSON response
 *
 * Use these helpers to centralize fetch behavior and User-Agent.
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 15_000
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeout} ms: ${url}`));
    }, timeout);

    fetch(url, options)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function safeFetchJSON(url: string, options: RequestInit = {}) {
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0", ...(options.headers ?? {}) },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Fetch failed (${res.status}) ${url} - ${body}`);
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    // Provide a short preview to help diagnosis without leaking everything.
    const preview = text.slice(0, 300);
    console.error("safeFetchJSON: invalid JSON response preview:", preview);
    throw new Error("Invalid JSON response");
  }
}
```

---

## `src/lib/db.ts`

```ts
/**
 * PostgreSQL connection pool helper.
 * Re-uses a global Pool across module reloads (helpful in dev/serverless).
 *
 * Exports:
 * - db: Pool instance (pg Pool)
 * - query<T>: helper that returns rows typed as T[]
 *
 * NOTE: keep pool configuration minimal here; for production you may want to
 * load a single DATABASE_URL env instead and configure SSL properly.
 */

import { Pool, QueryResultRow } from "pg";
import { env } from "./env";

/* Global pool to avoid creating multiple pools in dev/hot-reload */
declare global {
  // eslint-disable-next-line no-var
  var __pg_pool__: Pool | undefined;
}

function createPool() {
  // It is recommended to use a single DATABASE_URL in production and configure
  // SSL (rejectUnauthorized: false) when connecting to managed DBs.
  return new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER || undefined,
    password: env.DB_PASSWORD || undefined,
    database: env.DB_NAME || undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5000,
  });
}

export const db: Pool = global.__pg_pool__ || (global.__pg_pool__ = createPool());

export async function query<T extends QueryResultRow>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const client = await db.connect();
  try {
    const result = await client.query<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

---

## `src/lib/youtube.ts`

```ts
/**
 * YouTube utilities:
 * - resolvePlaylist: map friendly keywords to playlist IDs
 * - fetchPlaylistVideos: fetch playlist videos (paginated)
 * - getUpcomingEvents / getLiveEvents: search for upcoming/live events for channel
 * - fetchLiveDetails: fetch liveStreamingDetails for given video IDs
 *
 * All calls use safeFetchJSON (fetch.ts) and env config (env.ts).
 */

import { env } from "./env";
import { safeFetchJSON } from "./fetch";
import type { PlaylistResponse, LiveDetailsMap, LiveEventResponse } from "@/types/youtube";

const PLAYLIST_MAP: Record<string, string> = {
  "tpm-today": "PLFKDRuq7tnIpkl7eUKgCbdvpX7dCpAdRN",
  "performance-paradox": "PLFKDRuq7tnIpnPt44AVdo0QnqlCoEDfTy",
  frostbytes: "PLFKDRuq7tnIrjZiJ9LgCW7Yh9FL7Jr4Tg",
  "on-the-margins": "PLFKDRuq7tnIoQ_2Sv9fecaCPA-FeMOdf8",
  "supply-chain-unfiltered": "PLFKDRuq7tnIreQYw1tbkiv0CGKoAdWb9p",
  "thoughts-and-coffee": "PLFKDRuq7tnIphnKPW1IAivCVG92M0v6fE",
};

export function resolvePlaylist(keyword: string): string | null {
  return PLAYLIST_MAP[keyword] ?? null;
}

export async function fetchPlaylistVideos(
  playlistId: string,
  pageToken?: string,
  limit = 10
): Promise<PlaylistResponse> {
  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const data: any = await safeFetchJSON(url.toString());

  return {
    items: (data.items ?? []).map((item: any) => ({
      videoId: item.snippet.resourceId?.videoId ?? null,
      title: item.snippet.title ?? "",
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
}

async function ytRequestEvents(endpoint: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const data: any = await safeFetchJSON(url.toString());

  return {
    items: (data.items ?? []).map((item: any) => ({
      videoId: item.id?.videoId ?? null,
      title: item.snippet?.title ?? "",
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? null,
    })),
  } as LiveEventResponse;
}

export async function fetchLiveDetails(videoIds: string[]): Promise<LiveDetailsMap> {
  if (!videoIds || videoIds.length === 0) return {};

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "liveStreamingDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const data: any = await safeFetchJSON(url.toString());

  const result: LiveDetailsMap = {};
  for (const item of data.items ?? []) {
    result[item.id] = {
      scheduledStartTime: item.liveStreamingDetails?.scheduledStartTime ?? null,
      actualStartTime: item.liveStreamingDetails?.actualStartTime ?? null,
    };
  }
  return result;
}

export async function getUpcomingEvents() {
  return ytRequestEvents("search", {
    part: "snippet",
    type: "video",
    eventType: "upcoming",
    order: "date",
    key: env.YOUTUBE_API_KEY,
    channelId: env.YOUTUBE_CHANNEL_ID,
  });
}

export async function getLiveEvents() {
  return ytRequestEvents("search", {
    part: "snippet",
    type: "video",
    eventType: "live",
    order: "date",
    key: env.YOUTUBE_API_KEY,
    channelId: env.YOUTUBE_CHANNEL_ID,
  });
}
```

---

## `src/lib/wordpress.ts`

```ts
/**
 * WordPress helpers:
 * - fetchPostBySlug / fetchPostBySearch
 * - fetchMediaForPost
 * - resolvePodcastPostBySlug / resolvePodcastPostBySearch
 *
 * Uses safeFetchJSON and the WP_BASE env.
 */

import { env } from "./env";
import { safeFetchJSON } from "./fetch";
import { extractHtmlStructure } from "./html/extractHtml";
import type { WPResolvedPodcast, WPResolvedMinimal } from "@/types/wordpress";

export function extractLibsynUrl(html: string): string | null {
  const match = html.match(/<iframe[^>]+src="([^"]+)"/);
  return match ? match[1] : null;
}

export async function fetchPostBySlug(slug: string) {
  const url = `${env.WP_BASE}/posts?slug=${encodeURIComponent(
    slug
  )}&per_page=1&_fields=id,slug,title,content`;
  const posts: any = await safeFetchJSON(url);
  return posts?.[0] ?? null;
}

export async function fetchPostBySearch(searchText: string) {
  const url = `${env.WP_BASE}/posts?search=${encodeURIComponent(
    searchText
  )}&per_page=1&_fields=id,slug,title`;
  const posts: any = await safeFetchJSON(url);
  return posts?.[0] ?? null;
}

export async function fetchMediaForPost(postId: number) {
  const url = `${env.WP_BASE}/media?parent=${postId}`;
  const items: any = await safeFetchJSON(url);
  return items?.[0]?.guid?.rendered ?? null;
}

export async function resolvePodcastPostBySlug(slug: string): Promise<WPResolvedPodcast | { error: string } | null> {
  try {
    const post = await fetchPostBySlug(slug);
    if (!post) return { error: `No post found for slug: ${slug}` };

    const mediaGuid = await fetchMediaForPost(post.id);

    return {
      post_id: post.id,
      title: post.title?.rendered ?? "",
      slug: post.slug,
      media_guid: mediaGuid,
      libsynUrl: extractLibsynUrl(post.content?.rendered ?? ""),
      content: extractHtmlStructure(post.content?.rendered ?? ""),
    };
  } catch (err: any) {
    return { error: err.message ?? "Unknown error" };
  }
}

export async function resolvePodcastPostBySearch(searchText: string): Promise<WPResolvedMinimal | { error: string } | null> {
  try {
    const post = await fetchPostBySearch(searchText);
    if (!post) return { error: `No post found for search: ${searchText}` };

    const mediaGuid = await fetchMediaForPost(post.id);

    return {
      post_id: post.id,
      title: post.title?.rendered ?? "",
      slug: post.slug,
      media_guid: mediaGuid,
    };
  } catch (err: any) {
    return { error: err.message ?? "Unknown error" };
  }
}
```

---

## `src/lib/html/extractHtml.ts`

```ts
/**
 * Placeholder HTML extraction function.
 *
 * You told me to keep the placeholder — so this returns a minimal
 * structured object derived from the HTML string. If you later want
 * a fully-featured parser, replace this implementation with your HTML parser
 * (cheerio / parse5 / domparser) and transform into the HtmlNode AST.
 *
 * This function intentionally keeps the structure simple:
 * - title: inner <h1> text (first found)
 * - paragraphs: array of <p> inner texts
 *
 * It avoids importing heavy DOM libs here for simplicity.
 */

export function extractHtmlStructure(html: string | undefined | null) {
  if (!html) return null;

  try {
    // Very small heuristic parser using regex; safe for simple extraction.
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const paragraphMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];

    const title = titleMatch ? titleMatch[1].trim() : null;
    const paragraphs = paragraphMatches.map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );

    return { title, paragraphs };
  } catch (err) {
    console.error("extractHtmlStructure error:", err);
    return null;
  }
}
```

---

## `src/lib/schemas/chatRequest.ts`

```ts
/**
 * Zod schema for incoming chat requests.
 * This is the schema you provided; I moved it into src/lib/schemas for imports.
 */

import { z } from "zod";

export const ChatRequestSchema = z.object({
  user_message: z.string().min(1, "user_message is required"),
  chat_hist: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .default([]),
  sampling_paras: z
    .object({
      temperature: z.number().min(0).max(1).default(0.0),
    })
    .optional()
    .default({ temperature: 0.0 }),
  metadata: z.object({
    stream: z.boolean().default(true),
    user_id: z.string().min(1, "user_id is required"),
    video_id: z.string().nullable().optional(),
  }),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
```

---

## `src/types/youtube.ts`

```ts
// Strong types for YouTube utilities and responses.

export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface PlaylistVideo {
  videoId: string | null;
  title: string;
  thumbnail: string | null;
}

export interface PlaylistResponse {
  items: PlaylistVideo[];
  nextPageToken: string | null;
}

export interface LiveEventItem {
  videoId: string | null;
  title: string;
  thumbnail: string | null;
}

export interface LiveEventResponse {
  items: LiveEventItem[];
}

export interface LiveDetails {
  scheduledStartTime: string | null;
  actualStartTime: string | null;
}

export type LiveDetailsMap = Record<string, LiveDetails>;
```

---

## `src/types/wordpress.ts`

```ts
// Types for WordPress responses and resolved podcast payloads.

export interface WPPost {
  id: number;
  slug: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
}

export interface WPMediaItem {
  guid?: { rendered?: string };
}

export interface WPResolvedPodcast {
  post_id: number;
  title: string;
  slug: string;
  media_guid: string | null;
  libsynUrl?: string | null;
  content?: any;
}

export interface WPResolvedMinimal {
  post_id: number;
  title: string;
  slug: string;
  media_guid: string | null;
}
```

---

## `src/types/podcast.ts`

```ts
// Podcast DB + API response types

export interface PodcastDBRow {
  id?: number;
  video_id: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

export interface PodcastFullResponse {
  ok: boolean;
  wp: any;
  db: PodcastDBRow;
}

export interface PodcastListItem {
  video_id: string;
  post_id: number | null;
  title: string | null;
  slug: string | null;
  media_guid: string | null;
}

export interface PodcastListResponse {
  ok: boolean;
  results: PodcastListItem[];
}
```

---

## `src/types/chat.ts`

```ts
// Chat request/response typed models

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  model?: string;
  messages?: ChatMessage[];
  stream?: boolean;
  user?: string;
}

// Reuse zod schema for exact validation; this type is generic helper.
```

---

## `src/types/index.ts`

```ts
export * from "./youtube";
export * from "./wordpress";
export * from "./podcast";
export * from "./chat";
```

---

## `src/app/api/chat/route.ts`

```ts
/**
 * POST /api/chat
 *
 * Validates request using ChatRequestSchema and forwards the body to a private
 * streaming upstream (PRIVATE_STREAM_URL). Streams the upstream response back
 * to the client as-is (pipe-through).
 *
 * runtime = "edge" is kept to support edge deployments.
 */

import { NextResponse } from "next/server";
import { ChatRequestSchema } from "@/lib/schemas/chatRequest";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    if (!env.PRIVATE_STREAM_URL) {
      return new NextResponse("Missing PRIVATE_STREAM_URL", { status: 500 });
    }

    // parse body
    const raw = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // forward to upstream
    const upstream = await fetch(env.PRIVATE_STREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.PRIVATE_API_KEY}`,
      },
      body: JSON.stringify(parsed.data),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("Upstream error:", upstream.status, text);
      return new NextResponse("Upstream error", { status: 502 });
    }

    // Return the stream directly (let the runtime handle streaming)
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Chat route error:", err);
    return new NextResponse(err?.message ?? "Internal Server Error", {
      status: 500,
    });
  }
}
```

---

## `src/app/api/events/route.ts`

```ts
/**
 * GET /api/events
 *
 * Returns upcoming and live events for the configured YouTube channel.
 * Enriches 'upcoming' with schedule details (scheduledStartTime).
 */

import { NextResponse } from "next/server";
import {
  getUpcomingEvents,
  getLiveEvents,
  fetchLiveDetails,
} from "@/lib/youtube";

export async function GET() {
  try {
    const [upcoming, live] = await Promise.all([
      getUpcomingEvents(),
      getLiveEvents(),
    ]);

    const upcomingIds = (upcoming.items ?? [])
      .map((it: any) => it.videoId)
      .filter(Boolean);

    const upcomingDetails = await fetchLiveDetails(upcomingIds);

    const enrichedUpcoming = (upcoming.items ?? []).map((item: any) => ({
      ...item,
      scheduledStartTime: upcomingDetails[item.videoId]?.scheduledStartTime ?? null,
    }));

    // Sort by scheduledStartTime (nulls go to the end)
    enrichedUpcoming.sort((a: any, b: any) => {
      const t1 = a.scheduledStartTime ? new Date(a.scheduledStartTime).getTime() : Number.POSITIVE_INFINITY;
      const t2 = b.scheduledStartTime ? new Date(b.scheduledStartTime).getTime() : Number.POSITIVE_INFINITY;
      return t1 - t2;
    });

    return NextResponse.json({
      upcoming: enrichedUpcoming,
      live: live.items ?? [],
    });
  } catch (err: any) {
    console.error("Events route error:", err);
    return NextResponse.json({ error: err?.message ?? "Server Error" }, { status: 500 });
  }
}
```

---

## `src/app/api/watch/route.ts`

```ts
/**
 * GET /api/watch?t=<keyword>&pageToken=<token?>
 *
 * Resolve a playlist keyword to a playlistId via resolvePlaylist(),
 * then return playlist videos (paginated).
 */

import { NextResponse } from "next/server";
import { resolvePlaylist, fetchPlaylistVideos } from "@/lib/youtube";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("t");
    const pageToken = searchParams.get("pageToken") || undefined;

    if (!keyword) {
      return NextResponse.json({ error: "Missing keyword (t)" }, { status: 400 });
    }

    const playlistId = resolvePlaylist(keyword);
    if (!playlistId) {
      return NextResponse.json({ error: "Unknown keyword" }, { status: 404 });
    }

    const { items, nextPageToken } = await fetchPlaylistVideos(playlistId, pageToken, 10);

    return NextResponse.json({
      items,
      nextPageToken,
      hasMore: nextPageToken !== null,
    });
  } catch (err: any) {
    console.error("Watch route error:", err);
    return NextResponse.json({ error: err?.message ?? "Server Error" }, { status: 500 });
  }
}
```

---

## `src/app/api/podcasts/route.ts`

```ts
/**
 * GET /api/podcasts?cursor=1
 *
 * Paginated list of podcasts. Reads rows from DB and enriches with WordPress
 * metadata for each row via resolvePodcastPostBySearch().
 *
 * Fixes cursor typo ("curosr") -> "cursor".
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resolvePodcastPostBySearch } from "@/lib/wordpress";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cursorParam = searchParams.get("cursor") ?? "1";
    const cursor = Math.max(1, parseInt(cursorParam, 10));
    const pageSize = 10;
    const offset = (cursor - 1) * pageSize;

    const sql = `
      SELECT title, video_id
      FROM table
      ORDER BY id ASC
      LIMIT $1 OFFSET $2
    `;

    const rows = await query<{ title: string; video_id: string }>(sql, [pageSize, offset]);

    // Resolve WP posts in parallel (controlled concurrency could be added later)
    const results = await Promise.all(
      rows.map(async (row) => {
        const wp = await resolvePodcastPostBySearch(row.title);
        return {
          ...((typeof wp === "object" && "error" in wp) ? { error: wp.error } : wp),
          video_id: row.video_id,
        };
      })
    );

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("Podcasts list error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Server Error" }, { status: 500 });
  }
}
```

---

## `src/app/api/podcasts/[slug]/[id]/route.ts`

```ts
/**
 * GET /api/podcasts/[slug]/[id]
 *
 * Fetch DB row by video_id and fetch corresponding WordPress post by slug.
 * Returns both DB row and WP resolved data.
 */

import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { resolvePodcastPostBySlug } from "@/lib/wordpress";

export async function GET(
  req: Request,
  context: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id: videoId } = context.params;

    const sql = `
      SELECT *
      FROM table
      WHERE video_id = $1
    `;

    const rows = await query<any>(sql, [videoId]);
    const dbRow = rows?.[0] ?? null;

    if (!dbRow) {
      return NextResponse.json({ error: `No database record found for video_id ${videoId}` }, { status: 404 });
    }

    const wpData = await resolvePodcastPostBySlug(slug);

    return NextResponse.json({ ok: true, wp: wpData, db: dbRow });
  } catch (err: any) {
    console.error("Podcast single error:", err);
    return NextResponse.json({ error: err?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
```

---

## `src/app/api/health/route.ts`

```ts
/**
 * Simple health/readiness endpoint.
 * Useful for uptime checks and load balancers.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
```

---

## `package.json` (minimal, for context)

```json
{
  "name": "nextjs-api-production",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "next": "14.x",
    "pg": "^8.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0"
  }
}
```

(Adjust `next` version to your project.)

---

## `.env.example`

```
# Upstream streaming API
PRIVATE_STREAM_URL="https://upstream.example.com/stream"
PRIVATE_API_KEY="your-private-api-key"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"
YOUTUBE_CHANNEL_ID="UCjjcxxsvx5sDR0F33ciy1QQ"

# WordPress base (wp-json/v2)
WP_BASE="https://your-wordpress-site.com/wp-json/wp/v2"

# Postgres DB connection pieces (or use DATABASE_URL)
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_USER="db_user"
DB_PASSWORD="db_password"
DB_NAME="db_name"
```

---

## `README.md` (short)

```md
# Next.js API — production-ready layout

This repository contains a production-ready structure for a Next.js App Router API
providing endpoints for chat (stream proxy), YouTube events, watch playlists,
podcasts list and individual podcast metadata.

Key points:
- Centralized env & fetch helpers (src/lib)
- Zod validation for chat request
- Typed types in src/types
- Placeholder HTML extractor (src/lib/html/extractHtml.ts) — replace with real parser later
- Health route for readiness checks

Set environment variables from `.env.example` before running.
```

---

# Notes, recommendations & next steps

1. **Secrets & env**: In production use a secure secrets manager. Avoid committing `.env` with real keys.
2. **DB SSL**: For managed DBs (e.g., RDS, Neon), enable SSL and set `rejectUnauthorized` appropriately.
3. **Rate limits & retries**: Add retry/backoff for YouTube/WordPress calls if you expect transient failures.
4. **Caching**: Consider caching YouTube/WordPress responses (Redis, in-memory TTL) to reduce API costs.
5. **Concurrency control**: For `/podcasts` post-resolution you may want to limit concurrency if many rows are processed.
6. **Logging & monitoring**: Add structured logging, error monitoring (Sentry), and metrics (Prometheus).
7. **Tests**: Add unit tests for `lib/fetch`, `lib/wordpress`, and `youtube` helpers.

---

If you want, I can:

* Convert DB helpers to **Prisma** or **Drizzle** and generate models.
* Implement a robust HTML AST parser for `extractHtmlStructure`.
* Add caching (Redis) and example caching middleware.
* Produce a Dockerfile and Kubernetes manifests.

Which would you like next?
