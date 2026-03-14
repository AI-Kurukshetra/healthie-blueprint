import { z } from "zod"

export const appointmentSchema = z.object({
  patient_id: z.string().uuid("Select a patient"),
  appointment_date: z.string().min(1, "Select a date"),
  appointment_time: z.string().min(1, "Select a time"),
  duration: z.number().min(15, "Minimum 15 minutes").max(120, "Maximum 120 minutes"),
  type: z.enum(["video", "in_person", "phone"], {
    message: "Select appointment type",
  }),
  reason: z
    .string()
    .min(10, "Please describe the reason in at least 10 characters")
    .max(500, "Reason must be under 500 characters"),
})

export const cancelAppointmentSchema = z.object({
  appointment_id: z.string().uuid("Invalid appointment"),
})

export const appointmentDeclineSchema = cancelAppointmentSchema.extend({
  reason: z
    .string()
    .max(500, "Reason must be under 500 characters")
    .optional()
    .transform((value) => value?.trim() ?? ""),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>
