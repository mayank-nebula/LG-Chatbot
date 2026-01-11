import { NextResponse } from "next/server";

import {
  getLiveEvents,
  getUpcomingEvents,
  fetchLiveDetails,
} from "@/lib/youtube";

export async function GET(req: Request) {
  try {
    const [upcoming, live] = await Promise.all([
      getUpcomingEvents(),
      getLiveEvents(),
    ]);

    const upcomingIds = (upcoming.items ?? []).map(
      (item: any) => item?.videoId
    );
    const upcomingDetails = await fetchLiveDetails(upcomingIds);

    const enrichedUpcoming = (upcoming.items ?? []).map((item: any) => {
      const videoId = item?.videoId;
      return {
        ...item,
        scheduledStartTime:
          upcomingDetails[videoId]?.scheduledStartTime ?? null,
      };
    });

    enrichedUpcoming.sort((a: any, b: any) => {
      const t1 = new Date(a.scheduledStartTime).getTime();
      const t2 = new Date(b.scheduledStartTime).getTime();
      return t1 - t2;
    });

    return NextResponse.json({
      upcoming: enrichedUpcoming,
      live: live.items ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
