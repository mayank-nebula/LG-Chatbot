const MAP: Record<string, string> = {
  "tpm-today": "PLFKDRuq7tnIpkl7eUKgCbdvpX7dCpAdRN",
  "performance-paradox": "PLFKDRuq7tnIpnPt44AVdo0QnqlCoEDfTy",
  frostbytes: "PLFKDRuq7tnIrjZiJ9LgCW7Yh9FL7Jr4Tg",
  "on-the-margins": "PLFKDRuq7tnIoQ_2Sv9fecaCPA-FeMOdf8",
  "supply-chain-unfiltered": "PLFKDRuq7tnIreQYw1tbkiv0CGKoAdWb9p",
  "thoughts-and-coffee": "PLFKDRuq7tnIphnKPW1IAivCVG92M0v6fE",
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
    `?part=snippet&maxResults=${limit}&playlistId=${playlistId}&key=${key}&order=viewCount`;

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

async function ytRequestEvents(
  endpoint: string,
  params: Record<string, string>
) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}?${qs}`;

  const res = await fetch(url);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`YouTube API Error: ${res.status} - ${error}`);
  }

  const data = await res.json();

  return {
    items: data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url ?? null,
    })),
  };
}

export async function fetchLiveDetails(videoIds: string[]) {
  if (!videoIds || videoIds.length === 0) return {};

  const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoIds.join(
    ","
  )}&key=${process.env.YOUTUBE_API_KEY!}`;

  const res = await fetch(url);
  const data = await res.json();

  const result: Record<string, any> = {};

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
    key: process.env.YOUTUBE_API_KEY!,
    channelId: "UCjjcxxsvx5sDR0F33ciy1QQ",
  });
}

export async function getLiveEvents() {
  return ytRequestEvents("search", {
    part: "snippet",
    type: "video",
    eventType: "live",
    order: "date",
    key: process.env.YOUTUBE_API_KEY!,
    channelId: "UCjjcxxsvx5sDR0F33ciy1QQ",
  });
}
