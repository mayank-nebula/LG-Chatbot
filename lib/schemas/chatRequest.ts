import { z } from "zod";

export const ChatRequestSchema = z.object({
  user_message: z.string().min(1, "user_message is required"),
  chat_hist: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .default([]),
  sampling_paras: z.object({
    temperature: z.number().min(0).max(1).default(0.0),
  }),
  metadata: z.object({
    stream: z.boolean().default(true),
    user_id: z.string().min(1, "user_id is required"),
    video_id: z.string().nullable().optional(),
  }),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
