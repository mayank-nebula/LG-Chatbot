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
      scheduledStartTime:
        upcomingDetails[item.videoId]?.scheduledStartTime ?? null,
    }));

    // Sort by scheduledStartTime (nulls go to the end)
    enrichedUpcoming.sort((a: any, b: any) => {
      const t1 = a.scheduledStartTime
        ? new Date(a.scheduledStartTime).getTime()
        : Number.POSITIVE_INFINITY;
      const t2 = b.scheduledStartTime
        ? new Date(b.scheduledStartTime).getTime()
        : Number.POSITIVE_INFINITY;
      return t1 - t2;
    });

    return NextResponse.json({
      upcoming: enrichedUpcoming,
      live: live.items ?? [],
    });
  } catch (err: any) {
    console.error("Events route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}












{
  "upcoming": [
    {
      "videoId": "Dxs_cse0HMI",
      "title": "Karoline Leavitt LIVE: White House Press Briefing on Iran, ICE, Greenland Tensions | US News | Trump",
      "thumbnail": "https://i.ytimg.com/vi/Dxs_cse0HMI/mqdefault.jpg",
      "scheduledStartTime": "2026-01-19T03:15:00Z"
    },
    {
      "videoId": "Pn4l7eyZc_Q",
      "title": "Trump LIVE | Trump Drops BIG BOMBSHELL On Greenland Takeover; Reveals 1ST Action Against NATO",
      "thumbnail": "https://i.ytimg.com/vi/Pn4l7eyZc_Q/mqdefault_live.jpg",
      "scheduledStartTime": "2026-01-19T11:00:00Z"
    },
    {
      "videoId": "VlDb9Wa3JfM",
      "title": "Trump LIVE | Donald Trump Makes Big Announcement | Trump Latest News Live | Trump Speech | US News",
      "thumbnail": "https://i.ytimg.com/vi/VlDb9Wa3JfM/mqdefault_live.jpg",
      "scheduledStartTime": "2026-01-19T17:30:00Z"
    },
    {
      "videoId": "Djfdu77JEG4",
      "title": "LIVE | &#39;American Military Will Strike Russia...&#39;: Trump OPENLY DECLARES War On Putin Nation If...",
      "thumbnail": "https://i.ytimg.com/vi/Djfdu77JEG4/mqdefault_live.jpg",
      "scheduledStartTime": "2026-01-19T18:15:00Z"
    }
  ],
  "live": [
    {
      "videoId": "Y-CAY7gzkSs",
      "title": "DONALD TRUMP LIVE: Trump Warns NATO, Pay US Tariffs or Give Greenland | World News LIVE | Nato",
      "thumbnail": "https://i.ytimg.com/vi/Y-CAY7gzkSs/mqdefault_live.jpg"
    },
    {
      "videoId": "m1Lg6l41JRA",
      "title": "US-IRAN TENSIONS LIVE | Trump Calls For &#39;New Leadership&#39; In Iran As Protests Intensify; Tehran React",
      "thumbnail": "https://i.ytimg.com/vi/m1Lg6l41JRA/mqdefault_live.jpg"
    },
    {
      "videoId": "9QfWdP77AK4",
      "title": "LIVE | BREAKING: Trump To Strike Tehran Tonight? US Keeps Airstrikes “ON THE TABLE” | Iran | US News",
      "thumbnail": "https://i.ytimg.com/vi/9QfWdP77AK4/mqdefault_live.jpg"
    },
    {
      "videoId": "aHtf3ZIoYQA",
      "title": "Donald Trump LIVE | Cabinet Stunned as Trump Moves to Elevate Elon Musk | Trump | Elon Musk",
      "thumbnail": "https://i.ytimg.com/vi/aHtf3ZIoYQA/mqdefault_live.jpg"
    },
    {
      "videoId": "5SPbWcZKk_o",
      "title": "GREENLAND PROTESTS LIVE | Nuuk March Against U.S. Annexation Plans Outside Consulate | World News",
      "thumbnail": "https://i.ytimg.com/vi/5SPbWcZKk_o/mqdefault_live.jpg"
    }
  ]
}






