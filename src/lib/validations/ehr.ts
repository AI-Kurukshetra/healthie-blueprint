import { z } from "zod"

export const medicationRouteSchema = z.enum([
  "oral",
  "injection",
  "topical",
  "inhaled",
  "other",
])

export const medicalHistoryTypeSchema = z.enum([
  "past_condition",
  "surgery",
  "family_history",
  "vaccination",
  "allergy",
  "hospitalization",
])

export const prescriptionStatusSchema = z.enum([
  "active",
  "dispensed",
  "expired",
  "cancelled",
])

export const medicationSchema = z.object({
  dosage: z.string().min(1, "Dosage is required").max(100, "Dosage is too long"),
  end_date: z.string().optional().or(z.literal("")),
  frequency: z
    .string()
    .min(2, "Frequency is required")
    .max(100, "Frequency is too long"),
  name: z.string().min(2, "Medication name is required").max(100, "Name is too long"),
  notes: z.string().max(1000, "Notes must be under 1000 characters").optional().or(z.literal("")),
  reason: z
    .string()
    .max(500, "Reason must be under 500 characters")
    .optional()
    .or(z.literal("")),
  route: medicationRouteSchema.default("oral"),
  start_date: z.string().min(1, "Start date is required"),
})

export const medicalHistorySchema = z.object({
  date_occurred: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  history_type: medicalHistoryTypeSchema,
  is_resolved: z.boolean().default(false),
  title: z.string().min(3, "Title is required").max(150, "Title is too long"),
})

export const prescriptionMedicationItemSchema = z.object({
  dosage: z.string().min(1, "Dosage is required").max(100, "Dosage is too long"),
  duration: z
    .string()
    .max(100, "Duration must be under 100 characters")
    .optional()
    .or(z.literal("")),
  frequency: z
    .string()
    .min(1, "Frequency is required")
    .max(100, "Frequency is too long"),
  instructions: z
    .string()
    .max(300, "Instructions must be under 300 characters")
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, "Medication name is required").max(150, "Name is too long"),
})

export const prescriptionSchema = z.object({
  appointment_id: z.string().uuid("Invalid appointment").optional().or(z.literal("")),
  expires_at: z.string().optional().or(z.literal("")),
  instructions: z
    .string()
    .max(1000, "Instructions must be under 1000 characters")
    .optional()
    .or(z.literal("")),
  medications: z
    .array(prescriptionMedicationItemSchema)
    .min(1, "Add at least one medication"),
})

export const allergiesAndConditionsSchema = z.object({
  allergies: z.array(z.string().min(1)).default([]),
  chronic_conditions: z.array(z.string().min(1)).default([]),
})

export const ehrRecordIdSchema = z.object({
  id: z.string().uuid("Invalid record"),
})

export type MedicationInput = z.input<typeof medicationSchema>
export type MedicalHistoryInput = z.input<typeof medicalHistorySchema>
export type PrescriptionInput = z.input<typeof prescriptionSchema>
export type AllergiesAndConditionsInput = z.input<typeof allergiesAndConditionsSchema>
