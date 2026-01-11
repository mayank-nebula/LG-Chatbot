import { NextResponse } from "next/server";

import { ChatRequestSchema } from "@/lib/schemas/chatRequest";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const upstreamUrl = process.env.PRIVATE_STREAM_URL;
    if (!upstreamUrl) {
      return new NextResponse("Missing PRIVATE_STREAM_URL", { status: 500 });
    }

    const rawBody = await req.json().catch(() => null);
    const parsed = ChatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const validBody = parsed.data;

    // Forward the request body to upstream
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PRIVATE_API_KEY}`,
      },
      body: JSON.stringify(validBody),
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return new NextResponse("Upstream error", { status: 502 });
    }

    // Stream upstream response directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamResponse.body!.getReader();

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            // Push chunk to client
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}
