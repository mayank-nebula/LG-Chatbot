import { z } from "zod";

export const EmailRequestSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  variables: z.object({
    eventName: z.string().trim().min(1, "Event Name is required"),
    fullName: z.string().trim().min(1, "First Name is required"),
    titleAndCompany: z.string().trim().min(1, "Title and Company is required"),
  }),
  sendAt: z.iso
    .datetime({ error: "sendAt must be a valid ISO 8601 datetime string" })
    .optional(),
});

export type EmailRequest = z.infer<typeof EmailRequestSchema>;
