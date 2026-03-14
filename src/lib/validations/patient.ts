import { z } from "zod"

const phoneRegex = /^[6-9]\d{9}$/

export const bloodGroupSchema = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
])

export const patientSchema = z.object({
  first_name: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be under 50 characters"),
  last_name: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be under 50 characters"),
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .regex(phoneRegex, "Enter valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional(),
  blood_group: bloodGroupSchema.optional(),
  allergies: z.array(z.string().min(1)).default([]),
  chronic_conditions: z.array(z.string().min(1)).default([]),
  emergency_contact: z.string().max(100).optional().or(z.literal("")),
  emergency_phone: z
    .string()
    .regex(phoneRegex, "Enter valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  insurance_provider: z.string().max(100).optional().or(z.literal("")),
  insurance_id: z.string().max(50).optional().or(z.literal("")),
})

export const patientIdSchema = z.object({
  id: z.string().uuid("Invalid patient"),
})

export type PatientFormValues = z.input<typeof patientSchema>
export type PatientInput = z.infer<typeof patientSchema>
