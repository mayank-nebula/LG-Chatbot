export const getEventsData = cache(
  async (limit = 4): Promise<WebinarDataResponse> => {
    try {
      // 1. Fetch Lists (Exactly like your script)
      const [upcomingRes, liveRes] = await Promise.all([
        getUpcomingEvents(),
        getLiveEvents(),
      ]);

      const rawUpcoming = upcomingRes.items ?? [];
      const rawLive = liveRes.items ?? [];

      // 2. Extract IDs for metadata enrichment (Optimized batch call)
      const upcomingIds = rawUpcoming
        .map((it: any) => it.videoId)
        .filter((id): id is string => Boolean(id));

      const liveIds = rawLive
        .map((it: any) => it.videoId)
        .filter((id): id is string => Boolean(id));

      const detailsMap = await fetchLiveDetails([...upcomingIds, ...liveIds]);

      // 3. Process Live Events (Matching your sample where scheduledStartTime might be missing)
      const live = rawLive
        .filter((item: any) => item.videoId)
        .map((item: any) => {
          const vId = item.videoId as string;
          return formatEvent(item, detailsMap[vId], true);
        })
        .slice(0, limit);

      // 4. Process Upcoming Events (Including your sorting logic)
      const upcoming = rawUpcoming
        .filter((item: any) => item.videoId)
        .map((item: any) => {
          const vId = item.videoId as string;
          return formatEvent(item, detailsMap[vId], false);
        })
        .sort((a, b) => {
          const t1 = a.scheduledStartTime
            ? new Date(a.scheduledStartTime).getTime()
            : Number.POSITIVE_INFINITY;
          const t2 = b.scheduledStartTime
            ? new Date(b.scheduledStartTime).getTime()
            : Number.POSITIVE_INFINITY;
          return t1 - t2;
        })
        .slice(0, limit);

      return { upcoming, live };
    } catch (err: any) {
      console.error("Webinar service error:", err);
      return { upcoming: [], live: [] };
    }
  }
);
