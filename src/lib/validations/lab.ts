import { z } from "zod"

export const labTestTypeSchema = z.enum([
  "blood",
  "urine",
  "imaging",
  "biopsy",
  "ecg",
  "culture",
  "other",
])

export const labPrioritySchema = z.enum(["routine", "urgent", "stat"])

export const labOrderStatusSchema = z.enum([
  "ordered",
  "sample_collected",
  "processing",
  "completed",
  "cancelled",
])

export const labOrderSchema = z.object({
  appointment_id: z.string().uuid("Invalid appointment").optional().or(z.literal("")),
  instructions: z.string().max(1000, "Instructions must be under 1000 characters").optional().or(z.literal("")),
  patient_id: z.string().uuid("Select a patient"),
  priority: labPrioritySchema.default("routine"),
  test_name: z.string().min(3, "Test name is required").max(150, "Test name is too long"),
  test_type: labTestTypeSchema,
})

export const labResultSchema = z.object({
  file_url: z.string().optional().or(z.literal("")),
  findings: z.string().max(2000, "Findings must be under 2000 characters").optional().or(z.literal("")),
  is_abnormal: z.boolean().default(false),
  notes: z.string().max(1000, "Notes must be under 1000 characters").optional().or(z.literal("")),
  result_summary: z.string().min(5, "Result summary is required").max(500, "Summary is too long"),
  status: z.enum(["sample_collected", "processing", "completed"]),
})

export type LabOrderInput = z.input<typeof labOrderSchema>
export type LabResultInput = z.input<typeof labResultSchema>
