import { z } from "zod"

const optionalNumber = (min: number, max: number, requiredMessage: string) =>
  z
    .number()
    .min(min, requiredMessage)
    .max(max, requiredMessage)
    .optional()

export const soapNoteSchema = z.object({
  patient_id: z.string().uuid("Patient is required"),
  appointment_id: z.string().uuid().optional(),
  subjective: z.string().min(10, "Subjective notes required (min 10 characters)"),
  objective: z.string().optional().or(z.literal("")),
  assessment: z.string().min(5, "Assessment is required"),
  plan: z.string().min(10, "Plan is required (min 10 characters)"),
  bp_systolic: optionalNumber(60, 250, "BP systolic must be between 60 and 250"),
  bp_diastolic: optionalNumber(40, 150, "BP diastolic must be between 40 and 150"),
  heart_rate: optionalNumber(30, 250, "Heart rate must be between 30 and 250"),
  temperature: optionalNumber(30, 45, "Temperature must be between 30 and 45"),
  weight: optionalNumber(1, 500, "Weight must be between 1 and 500"),
  height: optionalNumber(30, 250, "Height must be between 30 and 250"),
  oxygen_sat: optionalNumber(70, 100, "Oxygen saturation must be between 70 and 100"),
  diagnosis_codes: z.array(z.string()),
})

export const noteIdSchema = z.object({
  id: z.string().uuid("Invalid note"),
})

export type SOAPNoteInput = z.infer<typeof soapNoteSchema>
