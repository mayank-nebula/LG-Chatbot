Error [AxiosError]: Request failed with status code 400
    at async POST (app\api\schedule-transactional\route.ts:55:23)
  53 |
  54 |     // 4. Send
> 55 |     const response = (await client.messages.send({
     |                       ^
  56 |       message: {
  57 |         from_email: env.MAILCHIMP_FROM_EMAIL,
  58 |         subject: "Welcome to LTSC", {
  isAxiosError: true,
  code: 'ERR_BAD_REQUEST',
  config: [Object],
  request: [ClientRequest],
  response: [Object],
  status: 400
}
Email Error: TypeError: Cannot read properties of undefined (reading 'status')
    at POST (app\api\schedule-transactional\route.ts:70:16)
  68 |     // 5. Check Result
  69 |     const result = response[0];
> 70 |     if (result.status === "rejected" || result.status === "invalid") {
     |                ^
  71 |       return NextResponse.json(
  72 |         { error: result.reject_reason },
  73 |         { status: 422 },
