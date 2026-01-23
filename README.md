export const getEventsData = cache(
  async (): Promise<WebinarDataResponse> => { // 1. Removed limit parameter
    try {
      // 1. Fetch Lists
      const [upcomingRes, liveRes] = await Promise.all([
        getUpcomingEvents(),
        getLiveEvents(),
      ]);

      const rawUpcoming = upcomingRes.items ?? [];
      const rawLive = liveRes.items ?? [];

      // 2. Extract IDs for metadata enrichment
      const upcomingIds = rawUpcoming
        .map((it: any) => it.videoId)
        .filter((id): id is string => Boolean(id));

      const liveIds = rawLive
        .map((it: any) => it.videoId)
        .filter((id): id is string => Boolean(id));

      const detailsMap = await fetchLiveDetails([...upcomingIds, ...liveIds]);

      // 3. Format initial lists
      const initialLive = rawLive
        .filter((item: any) => item.videoId)
        .map((item: any) => formatEvent(item, detailsMap[item.videoId], true));

      const initialUpcoming = rawUpcoming
        .filter((item: any) => item.videoId)
        .map((item: any) => formatEvent(item, detailsMap[item.videoId], false));

      // 4. RE-DISTRIBUTION LOGIC (The Cache Fix)
      // If an 'upcoming' event's start time has passed, move it to 'live'
      const now = new Date();
      const live: any[] = [...initialLive];
      const upcoming: any[] = [];

      initialUpcoming.forEach((event) => {
        if (event.scheduledStartTime) {
          const startTime = new Date(event.scheduledStartTime);
          if (startTime <= now) {
            // Move to live because the start time has passed
            live.push({ ...event, isLive: true });
          } else {
            upcoming.push(event);
          }
        } else {
          upcoming.push(event);
        }
      });

      // 5. Final Sorting (Removed .slice() from both)
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
        return t2 - t1; // Show most recently started live events first
      });

      return { 
        upcoming: sortedUpcoming, 
        live: sortedLive 
      };
    } catch (err: any) {
      console.error("Webinar service error:", err);
      return { upcoming: [], live: [] };
    }
  }
);
