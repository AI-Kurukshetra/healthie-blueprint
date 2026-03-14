import { z } from "zod"

export const carePlanStatusSchema = z.enum(["draft", "active", "completed", "paused"])

export const carePlanSchema = z.object({
  title: z.string().min(3, "Title is required (min 3 characters)"),
  goals: z.string().min(10, "Please describe the goals (min 10 characters)"),
  instructions: z.string().optional().or(z.literal("")),
  diet_notes: z.string().optional().or(z.literal("")),
  exercise: z.string().optional().or(z.literal("")),
  follow_up: z.string().optional().or(z.literal("")),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  status: carePlanStatusSchema,
})

export const carePlanStatusUpdateSchema = z.object({
  id: z.string().uuid("Invalid care plan"),
  status: carePlanStatusSchema,
})

export type CarePlanInput = z.infer<typeof carePlanSchema>
export type CarePlanStatus = z.infer<typeof carePlanStatusSchema>
