import { z } from "zod"

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
  patient_id: z.string().uuid().optional(),
  receiver_id: z.string().uuid("Invalid recipient"),
})

export const markThreadReadSchema = z.object({
  counterpart_id: z.string().uuid("Invalid conversation"),
})

export type MessageInput = z.infer<typeof messageSchema>
