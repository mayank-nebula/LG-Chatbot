Error: Missing Mailchimp API Key
    at module evaluation (.next/server/chunks/[root-of-the-server]__e5c103a2._.js:3:40810)
    at instantiateModule (.next/server/chunks/[turbopack]_runtime.js:740:9)
    at instantiateRuntimeModule (.next/server/chunks/[turbopack]_runtime.js:768:12)
    at getOrInstantiateRuntimeModule (.next/server/chunks/[turbopack]_runtime.js:781:12)
    at Object.m (.next/server/chunks/[turbopack]_runtime.js:790:18)
    at Object.<anonymous> (.next/server/app/api/schedule-transactional/route.js:7:3)
import { NextResponse } from "next/server";

import mailchimpTx from "@mailchimp/mailchimp_transactional";

import { env } from "@/lib/env";
import { MailchimpResponseItem } from "@/types";
import { getEventEmailHtml } from "@/lib/email-template";
import { EmailRequestSchema } from "@/lib/schemas/emailRequest";

const API_KEY = env.MAILCHIMP_TRANSACTIONAL_API_KEY;

if (!API_KEY) throw new Error("Missing Mailchimp API Key");
const client = mailchimpTx(API_KEY);

const getRandomEventTitle = (eventName: string): string => {
  const titles = [
    `Starting in 15 minutes: ${eventName}`,
    `Grab your coffee, ${eventName} starts soon`,
    `It's almost time! Join ${eventName} now`,
    `Don't miss out: ${eventName} goes live shortly`,
  ];

  // Pick one randomly
  const randomIndex = Math.floor(Math.random() * titles.length);

  return titles[randomIndex];
};

function formatToMailchimpDate(isoDateString: string): string {
  return new Date(isoDateString).toISOString().replace("T", " ").slice(0, 19);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate Input
    const validation = EmailRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { email, variables, sendAt } = validation.data;

    // 2. Generate HTML from Template File using variables
    const htmlContent = getEventEmailHtml({
      fullName: variables.fullName,
      email: email,
      eventName: variables.eventName,
      videoId: variables.videoId,
    });

    // 3. Handle Date
    let formattedSendAt: string | undefined = undefined;
    if (sendAt) {
      formattedSendAt = formatToMailchimpDate(sendAt);
      if (new Date(sendAt).getTime() < Date.now()) {
        return NextResponse.json(
          { error: "Time must be in future" },
          { status: 400 },
        );
      }
    }

    // 4. Send
    const response = (await client.messages.send({
      message: {
        from_email: env.MAILCHIMP_FROM_EMAIL,
        subject: getRandomEventTitle(variables.eventName),
        html: htmlContent,
        to: [{ email: email, type: "to" }],
      },
      send_at: formattedSendAt,
    })) as MailchimpResponseItem[];

    // 5. Check Result
    const result = response[0];
    if (result.status === "rejected" || result.status === "invalid") {
      return NextResponse.json(
        { error: result.reject_reason },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      id: result._id,
      status: result.status,
    });
  } catch (error: any) {
    console.error("Email Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
