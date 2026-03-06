import { env } from "@/lib/env";
import { safeFetchJSON } from "@/lib/fetch";
import type {
  PlaylistResponse,
  LiveDetailsMap,
  LiveEventResponse,
} from "@/types/youtube";

export const PLAYLIST_MAP: Record<string, string> = {
  "tpm-today": "PLFKDRuq7tnIpkl7eUKgCbdvpX7dCpAdRN",
  "performance-paradox": "PLFKDRuq7tnIpnPt44AVdo0QnqlCoEDfTy",
  // frostbytes: "PLFKDRuq7tnIrjZiJ9LgCW7Yh9FL7Jr4Tg",
  // "on-the-margins": "PLFKDRuq7tnIoQ_2Sv9fecaCPA-FeMOdf8",
  // "supply-chain-unfiltered": "PLFKDRuq7tnIreQYw1tbkiv0CGKoAdWb9p",
  "thoughts-and-coffee": "PLFKDRuq7tnIphnKPW1IAivCVG92M0v6fE",
};

export function resolvePlaylist(keyword: string): string | null {
  return PLAYLIST_MAP[keyword] ?? null;
}

export async function fetchPlaylistVideos(
  playlistId: string,
  pageToken?: string,
  limit = 9,
): Promise<PlaylistResponse> {
  // throw new Error("API Connection Failed");
  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const data: any = await safeFetchJSON(url.toString(), {
    next: { revalidate: 3600 },
  });

  return {
    items: (data.items ?? []).map((item: any) => ({
      videoId: item.snippet.resourceId?.videoId ?? null,
      title: item.snippet.title ?? "",
      publishedAt: item.snippet.publishedAt ?? "",
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
    playlistThumbnail: data.items[0]?.snippet?.thumbnails?.high?.url,
    nextPageToken: data.nextPageToken ?? null,
  };
}

export async function fetchCompletedEvents(
  pageToken?: string,
  limit = 9,
): Promise<PlaylistResponse> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", env.YOUTUBE_CHANNEL_ID);
  url.searchParams.set("type", "video");
  url.searchParams.set("eventType", "completed");
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("order", "date");
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const data: any = await safeFetchJSON(url.toString(), {
    next: { revalidate: 3600 },
  });

  return {
    items: (data.items ?? []).map((item: any) => ({
      videoId: item.id?.videoId ?? null,
      title: item.snippet.title ?? "",
      publishedAt: item.snippet.publishedAt ?? "",
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
    playlistThumbnail: null,
    nextPageToken: data.nextPageToken ?? null,
  };
}

async function ytRequestEvents(
  endpoint: string,
  params: Record<string, string>,
) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const data: any = await safeFetchJSON(url.toString(), {
    next: { revalidate: 3600 },
  });

  return {
    items: (data.items ?? []).map((item: any) => ({
      videoId: item.id?.videoId ?? null,
      title: item.snippet?.title ?? "",
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? null,
    })),
  } as LiveEventResponse;
}

export async function fetchLiveDetails(
  videoIds: string[],
): Promise<LiveDetailsMap> {
  if (!videoIds || videoIds.length === 0) return {};

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "liveStreamingDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  const data: any = await safeFetchJSON(url.toString(), {
    next: { revalidate: 3600 },
  });

  const result: LiveDetailsMap = {};
  for (const item of data.items ?? []) {
    result[item.id] = {
      scheduledStartTime: item.liveStreamingDetails?.scheduledStartTime ?? null,
      actualStartTime: item.liveStreamingDetails?.actualStartTime ?? null,
    };
  }
  return result;
}

// Add this to lib/youtube.ts
export async function fetchAllRecentVideos(
  pageToken?: string,
  limit = 9,
): Promise<PlaylistResponse> {
  // throw new Error("API Connection Failed");
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", env.YOUTUBE_CHANNEL_ID);
  url.searchParams.set("maxResults", String(limit));
  url.searchParams.set("order", "date"); // This ensures we get the latest uploads
  url.searchParams.set("type", "video");
  url.searchParams.set("key", env.YOUTUBE_API_KEY);

  if (pageToken) url.searchParams.set("pageToken", pageToken);

  const data: any = await safeFetchJSON(url.toString(), {
    next: { revalidate: 3600 },
  });

  return {
    items: (data.items ?? []).map((item: any) => ({
      videoId: item.id?.videoId ?? null,
      title: item.snippet.title ?? "",
      publishedAt: item.snippet.publishedAt ?? "",
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
    playlistThumbnail: null,
    nextPageToken: data.nextPageToken ?? null,
  };
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
