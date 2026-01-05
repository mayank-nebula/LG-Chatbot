import { NextRequest, NextResponse } from "next/server";
import { createParser, type EventSourceMessage } from "eventsource-parser";

import { env } from "@/lib/env";
import { UpstreamPayload } from "@/types";
import { ChatRequestSchema } from "@/lib/schemas/chatRequest";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  try {
    const response = await fetch(
      `${env.PRIVATE_STREAM_URL}/generative_response`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: req.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "Upstream service error", details: errorText },
        { status: response.status }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const parser = createParser({
          onEvent: (event: EventSourceMessage) => {
            if (event.event === "brain/text") {
              try {
                const parsed: UpstreamPayload = JSON.parse(event.data);
                const text = parsed?.content?.parts?.[0]?.text;
                console.log(text);

                if (text) {
                  controller.enqueue(encoder.encode(`data: ${text}\n\n`));
                }
              } catch (e) {
                console.log(e);
              }
            }
          },
        });

        if (!response.body) {
          controller.close();
          return;
        }

        const reader = response.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            parser.feed(decoder.decode(value));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") return new Response(null, { status: 499 });
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
