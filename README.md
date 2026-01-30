import { z } from "zod";

export const EmailRequestSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  variables: z.object({
    firstName: z.string().trim().min(1, "First Name is required"),
  }),
  sendAt: z.iso
    .datetime({ error: "sendAt must be a valid ISO 8601 datetime string" })
    .optional(),
});

export type EmailRequest = z.infer<typeof EmailRequestSchema>;
