import { NextResponse } from "next/server";
import mailchimpTx from "@mailchimp/mailchimp_transactional";
import { z } from "zod";

// --- 1. CONFIGURATION & TYPES ---

// Ideally, import these from your types file, but defining here for completeness
interface MailchimpResponseItem {
  email: string;
  status: "sent" | "queued" | "scheduled" | "rejected" | "invalid";
  _id: string;
  reject_reason?: string | null;
}

// Replace with your actual import: import { env } from "@/lib/env";
const API_KEY = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY; 
// Make sure your env variable for email matches your verified domain (events.sitename.com)
const FROM_EMAIL = process.env.MAILCHIMP_FROM_EMAIL || "no-reply@events.sitename.com"; 

if (!API_KEY) throw new Error("Missing Mailchimp Transactional API Key");

const client = mailchimpTx(API_KEY);

// --- 2. ZOD SCHEMA (FIXED) ---

const EmailRequestSchema = z.object({
  // Fixed: z.email does not exist. Use z.string().email()
  email: z.string().email({ message: "Invalid email address" }), 
  variables: z.object({
    firstName: z.string().trim().min(1, "First Name is required"),
  }),
  // Fixed: z.iso does not exist. Use z.string().datetime()
  sendAt: z.string()
    .datetime({ message: "sendAt must be a valid ISO 8601 datetime string" })
    .optional(),
});

// Mock template function (Replace with your actual import)
import { getWelcomeEmailHtml } from "@/lib/email-template"; 
// If you don't have the import working yet, uncomment this mock:
// const getWelcomeEmailHtml = (vars: any) => `<h1>Welcome ${vars.firstName}</h1>`;

// --- 3. UTILITIES ---

function formatToMailchimpDate(isoDateString: string): string {
  // Converts "2024-05-20T10:00:00.000Z" -> "2024-05-20 10:00:00" (UTC)
  return new Date(isoDateString).toISOString().replace("T", " ").slice(0, 19);
}

// --- 4. API HANDLER ---

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // A. Validate Input
    const validation = EmailRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { email, variables, sendAt } = validation.data;

    // B. Generate HTML
    const htmlContent = getWelcomeEmailHtml({
      firstName: variables.firstName,
    });

    // C. Handle Date (Scheduling)
    let formattedSendAt: string | undefined = undefined;

    if (sendAt) {
      const sendDate = new Date(sendAt);
      
      // Allow a small buffer (e.g., requests arriving 5 seconds "late" are still okay)
      if (sendDate.getTime() < Date.now() - 5000) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 },
        );
      }
      formattedSendAt = formatToMailchimpDate(sendAt);
    }

    console.log(`🚀 Sending email to: ${email} from: ${FROM_EMAIL}`);
    if(formattedSendAt) console.log(`🕒 Scheduled for: ${formattedSendAt} UTC`);

    // D. Send Request to Mailchimp
    // Note: 'send_at' is optional. If undefined, it sends immediately.
    const response = (await client.messages.send({
      message: {
        from_email: FROM_EMAIL, 
        subject: "Welcome to LTSC",
        html: htmlContent,
        to: [{ email: email, type: "to" }],
      },
      // If this is defined, Mailchimp tries to schedule. 
      // NOTE: Free/Demo accounts will fail with 400 here if this is set.
      send_at: formattedSendAt, 
    })) as MailchimpResponseItem[];

    // E. Handle Response
    if (!response || response.length === 0) {
      throw new Error("Empty response received from Mailchimp");
    }

    const result = response[0];

    // Check for hard rejections (Bounce, spam complaint, etc)
    if (result.status === "rejected" || result.status === "invalid") {
      return NextResponse.json(
        { 
          error: "Email Rejected", 
          reason: result.reject_reason || "Unknown reason", // Safe fallback
          status: result.status 
        },
        { status: 422 },
      );
    }

    // Success (Sent, Queued, or Scheduled)
    return NextResponse.json({
      success: true,
      id: result._id,
      status: result.status, // Will be 'scheduled' if send_at was used
    });

  } catch (error: any) {
    // --- ERROR DEBUGGING ---
    
    // 1. Check if it is an Axios/Mailchimp API Error (The 400 source)
    if (error.response && error.response.data) {
      console.error("🔴 Mailchimp API Error:", JSON.stringify(error.response.data, null, 2));
      
      // This allows you to see the REAL error in your frontend/postman
      return NextResponse.json(
        { 
          error: "Mailchimp API Error", 
          message: error.response.data.message || error.response.data.name,
          details: error.response.data 
        },
        { status: error.response.status || 400 }
      );
    }

    // 2. Generic Server Error
    console.error("❌ Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 },
    );
  }
}
