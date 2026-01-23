export const getEventsData = cache(
  async (limit = 4): Promise<WebinarDataResponse> => {
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

      // 1. Process initial lists
      const initialLive = rawLive
        .filter((item: any) => item.videoId)
        .map((item: any) => formatEvent(item, detailsMap[item.videoId], true));

      const initialUpcoming = rawUpcoming
        .filter((item: any) => item.videoId)
        .map((item: any) => formatEvent(item, detailsMap[item.videoId], false));

      // 2. RE-DISTRIBUTION LOGIC
      // Check if "Upcoming" events should actually be "Live" based on current time
      const now = new Date();
      const live: any[] = [...initialLive];
      const upcoming: any[] = [];

      initialUpcoming.forEach((event) => {
        if (event.scheduledStartTime) {
          const startTime = new Date(event.scheduledStartTime);
          if (startTime <= now) {
            // This event was supposed to start already, move it to live
            live.push({ ...event, isLive: true });
          } else {
            upcoming.push(event);
          }
        } else {
          upcoming.push(event);
        }
      });

      // 3. Sort and Slice
      // Sort upcoming by start time (soonest first)
      const sortedUpcoming = upcoming
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

      // Optional: Sort live by start time (most recent first)
      const sortedLive = live
        .sort((a, b) => {
          const t1 = a.scheduledStartTime ? new Date(a.scheduledStartTime).getTime() : 0;
          const t2 = b.scheduledStartTime ? new Date(b.scheduledStartTime).getTime() : 0;
          return t2 - t1; 
        })
        .slice(0, limit);

      return { upcoming: sortedUpcoming, live: sortedLive };
    } catch (err: any) {
      console.error("Webinar service error:", err);
      return { upcoming: [], live: [] };
    }
  }
);
