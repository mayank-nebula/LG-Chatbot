To handle HTML content in a separate file with dynamic variables, the best practice in Next.js is to use **TypeScript functions that return template literals**. This gives you type safety for your variables and keeps your HTML separate from your API logic.

Here is the complete production-ready setup.

### 1. Create the Template File
Create a file to store your HTML structure. We will use a function to inject the variables.

**`lib/email-templates.ts`**

```typescript
// Define the shape of data this template needs
export interface WelcomeEmailVars {
  firstName: string;
  loginUrl: string;
  companyName: string;
}

// The function takes the variables and returns the compiled HTML string
export const getWelcomeEmailHtml = (vars: WelcomeEmailVars) => {
  return `
    <!DOCTYPE html>
    <html>
      <body style="font-family: sans-serif; line-height: 1.5; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <h2 style="color: #0070f3;">Welcome, ${vars.firstName}!</h2>
          
          <p>
            Thanks for joining <strong>${vars.companyName}</strong>. 
            We are excited to have you on board.
          </p>
          
          <p>Please click the button below to get started:</p>
          
          <a href="${vars.loginUrl}" 
             style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
             Login to Dashboard
          </a>

          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            If you didn't ask for this email, you can ignore it.
          </p>
          
        </div>
      </body>
    </html>
  `;
};
```

### 2. Update the Schema
We need to update your Zod schema to accept `variables` instead of raw `htmlContent`.

**`lib/schemas.ts`**

```typescript
import { z } from 'zod';

export const scheduleEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  
  // Validate that the variables object exists and has required fields
  variables: z.object({
    firstName: z.string().min(1),
    loginUrl: z.string().url(),
    companyName: z.string().optional().default("My Company"),
  }),

  // Date validation (same as before)
  sendAt: z.string().datetime().optional().or(
    z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  ),
});

export type ScheduleEmailInput = z.infer<typeof scheduleEmailSchema>;
```

### 3. Update the API Route
Now we import the template function and pass the validated variables into it.

**`app/api/schedule-transactional/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import mailchimpTx from '@mailchimp/mailchimp_transactional';
import { scheduleEmailSchema } from '@/lib/schemas'; 
import { getWelcomeEmailHtml } from '@/lib/email-templates'; // Import template

const API_KEY = process.env.MAILCHIMP_TRANSACTIONAL_API_KEY;
const FROM_EMAIL = process.env.MAILCHIMP_FROM_EMAIL || "noreply@yourdomain.com";

if (!API_KEY) throw new Error("Missing Mailchimp API Key");
const client = mailchimpTx(API_KEY);

function formatToMailchimpDate(isoDateString: string): string {
  return new Date(isoDateString).toISOString().replace('T', ' ').slice(0, 19);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Validate Input
    const validation = scheduleEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation Error", details: validation.error.flatten() }, { status: 400 });
    }

    const { email, subject, variables, sendAt } = validation.data;

    // 2. Generate HTML from Template File using variables
    const htmlContent = getWelcomeEmailHtml({
      firstName: variables.firstName,
      loginUrl: variables.loginUrl,
      companyName: variables.companyName || "My Company"
    });

    // 3. Handle Date
    let formattedSendAt = null;
    if (sendAt) {
      formattedSendAt = formatToMailchimpDate(sendAt);
      if (new Date(sendAt).getTime() < Date.now()) {
        return NextResponse.json({ error: "Time must be in future" }, { status: 400 });
      }
    }

    // 4. Send
    const response = await client.messages.send({
      message: {
        from_email: FROM_EMAIL,
        subject: subject,
        html: htmlContent, // <--- Injected here
        to: [{ email: email, type: "to" }],
      },
      send_at: formattedSendAt, 
    });

    // 5. Check Result
    const result = response[0];
    if (result.status === 'rejected' || result.status === 'invalid') {
      return NextResponse.json({ error: result.reject_reason }, { status: 422 });
    }

    return NextResponse.json({ success: true, id: result._id, status: result.status });

  } catch (error: any) {
    console.error("Email Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

### 4. How to call it from Frontend

```javascript
const sendInvite = async () => {
  await fetch('/api/schedule-transactional', {
    method: 'POST',
    body: JSON.stringify({
      email: "jane@example.com",
      subject: "Welcome to the Platform!",
      // We pass variables, not HTML
      variables: {
        firstName: "Jane",
        loginUrl: "https://mysite.com/login?token=abc",
        companyName: "Acme Corp"
      },
      sendAt: new Date().toISOString()
    })
  });
};
```

### Advanced Option: React Email (Recommended for complex HTML)
If your HTML is complex, writing strings (as done in Step 1) is error-prone. The modern industry standard for Next.js is **React Email**.

1.  `npm install @react-email/components @react-email/render`
2.  Create a standard React component for your email (`emails/Welcome.tsx`).
3.  In your API route:

```typescript
import { render } from '@react-email/render';
import WelcomeEmail from '@/emails/Welcome'; // Your React Component

// ... inside POST ...
const htmlContent = render(
  <WelcomeEmail 
    firstName={variables.firstName} 
    loginUrl={variables.loginUrl} 
  />
);
```

This allows you to build emails using Flexbox, CSS, and Tailwind just like a normal webpage.
