import "server-only";
import { cache } from "react";
import {
  getUpcomingEvents,
  getLiveEvents,
  fetchLiveDetails,
} from "@/lib/youtube";

export interface FormattedEvent {
  id: string;
  title: string;
  description: string;
  month: string;
  day: string;
  time: string;
  thumbnail: string;
  scheduledStartTime: string | null;
  isLive: boolean;
}

export interface WebinarDataResponse {
  upcoming: FormattedEvent[];
  live: FormattedEvent[];
}

function formatEvent(
  item: any,
  details: { scheduledStartTime?: string | null } | undefined,
  isLive: boolean
): FormattedEvent {
  const startTime =
    details?.scheduledStartTime ?? item.scheduledStartTime ?? null;
  const date = startTime ? new Date(startTime) : new Date();

  return {
    id: item.videoId,
    title: item.title,
    description: "Join us for this exclusive live session on YouTube.",
    thumbnail: item.thumbnail,
    scheduledStartTime: startTime,
    isLive: isLive,

    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),

    day: date.toLocaleDateString("en-US", { day: "2-digit" }),

    time: `${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    })} • ${isLive ? "LIVE NOW" : "YouTube Live"}`,
  };
}

export const getEventsData = cache(async (): Promise<WebinarDataResponse> => {
  try {
    const [upcomingRes, liveRes] = await Promise.all([
      getUpcomingEvents(),
      getLiveEvents(),
    ]);

    const rawUpcoming = upcomingRes.items ?? [];
    const rawLive = liveRes.items ?? [];

    const upcomingIds = rawUpcoming
      .map((it: any) => it.videoId)
      .filter((id): id is string => Boolean(id));

    const liveIds = rawLive
      .map((it: any) => it.videoId)
      .filter((id): id is string => Boolean(id));

    const detailsMap = await fetchLiveDetails([...upcomingIds, ...liveIds]);

    const initialLive = rawLive
      .filter((item: any) => item.videoId)
      .map((item: any) => formatEvent(item, detailsMap[item.videoId], true));

    const initialUpcoming = rawUpcoming
      .filter((item: any) => item.videoId)
      .map((item: any) => formatEvent(item, detailsMap[item.videoId], false));

    const now = new Date();
    const live: any[] = [...initialLive];
    const upcoming: any[] = [];

    initialUpcoming.forEach((event) => {
      if (event.scheduledStartTime) {
        const startTime = new Date(event.scheduledStartTime);
        if (startTime <= now) {
          live.push({ ...event, isLive: true });
        } else {
          upcoming.push(event);
        }
      } else {
        upcoming.push(event);
      }
    });

    const sortedUpcoming = upcoming.sort((a, b) => {
      const t1 = a.scheduledStartTime
        ? new Date(a.scheduledStartTime).getTime()
        : Number.POSITIVE_INFINITY;
      const t2 = b.scheduledStartTime
        ? new Date(b.scheduledStartTime).getTime()
        : Number.POSITIVE_INFINITY;
      return t1 - t2;
    });

    const sortedLive = live.sort((a, b) => {
      const t1 = a.scheduledStartTime
        ? new Date(a.scheduledStartTime).getTime()
        : 0;
      const t2 = b.scheduledStartTime
        ? new Date(b.scheduledStartTime).getTime()
        : 0;
      return t2 - t1;
    });

    return {
      upcoming: sortedUpcoming,
      live: sortedLive,
    };
  } catch (err: any) {
    console.error("Webinar service error:", err);
    return { upcoming: [], live: [] };



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
  }
});
