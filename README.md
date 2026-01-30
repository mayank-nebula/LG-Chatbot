export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const validation = EmailRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation Error", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { email, variables, sendAt } = validation.data;
    
    const htmlContent = getWelcomeEmailHtml({
      firstName: variables.firstName,
    });
    
    let formattedSendAt: string | undefined = undefined;
    if (sendAt) {
      const sendAtDate = new Date(sendAt);
      
      // Check if date is in future
      if (sendAtDate.getTime() < Date.now()) {
        return NextResponse.json(
          { error: "Time must be in future" },
          { status: 400 },
        );
      }
      
      // Format to YYYY-MM-DD HH:MM:SS in UTC
      formattedSendAt = formatToMailchimpDate(sendAt);
    }
    
    // Build the request payload
    const payload: any = {
      message: {
        from_email: env.MAILCHIMP_FROM_EMAIL,
        subject: "Welcome to LTSC",
        html: htmlContent,
        to: [{ email: email, type: "to" }],
      },
    };
    
    // Only add send_at if we have a scheduled time
    if (formattedSendAt) {
      payload.send_at = formattedSendAt;
    }
    
    console.log("Sending email with payload:", JSON.stringify(payload, null, 2));
    
    const response = await client.messages.send(payload);
    
    console.log("Mailchimp response:", JSON.stringify(response, null, 2));
    
    // Check if response is an array
    if (!Array.isArray(response) || response.length === 0) {
      console.error("Unexpected response format:", response);
      return NextResponse.json(
        { error: "Unexpected response from email service" },
        { status: 500 },
      );
    }
    
    const result = response[0];
    
    if (result.status === "rejected" || result.status === "invalid") {
      return NextResponse.json(
        { error: result.reject_reason || "Email rejected" },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      id: result._id,
      status: result.status,
    });
    
  } catch (error: any) {
    console.error("Email Error Details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack,
    });
    
    // Return more detailed error info
    return NextResponse.json(
      { 
        error: "Failed to send email",
        details: error.response?.data || error.message,
      },
      { status: 500 },
    );
  }
}
