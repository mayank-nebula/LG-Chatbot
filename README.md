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
                const payload: UpstreamPayload = JSON.parse(event.data);
                const text = payload?.content?.parts?.[0]?.text;

                if (text) {
                  // SSE Protocol: If text contains newlines, every single line 
                  // must be prefixed with "data: " to be part of the same message.
                  const formatted = text
                    .split("\n")
                    .map((line) => `data: ${line}`)
                    .join("\n");
                  
                  controller.enqueue(encoder.encode(`${formatted}\n\n`));
                }
              } catch (e) {
                console.error("Stream parse error:", e);
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
            // { stream: true } ensures multi-byte characters aren't cut off between chunks
            parser.feed(decoder.decode(value, { stream: true }));
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
        "X-Accel-Buffering": "no", // Disables buffering on Nginx/Proxies
        "Connection": "keep-alive",
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
