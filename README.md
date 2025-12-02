import { NextResponse } from "next/server";

import { getLiveEvents, getUpcomingEvents } from "@/lib/youtube";

export async function GET(req: Request) {
  try {
    const [upcoming, live] = await Promise.all([
      getUpcomingEvents(),
      getLiveEvents(),
    ]);

    return NextResponse.json({
      upcoming: upcoming.items ?? [],
      live: live.items ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
