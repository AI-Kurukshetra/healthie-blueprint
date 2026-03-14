import { z } from "zod"

const phoneRegex = /^[6-9]\d{9}$/
const consentMessage = "You must accept all terms to continue"
const requiredConsent = z.literal(true, {
  message: consentMessage,
})

function isFutureDate(value?: string) {
  if (!value) {
    return false
  }

  const today = new Date().toISOString().split("T")[0]
  return value > today
}

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

export const patientRegisterSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .regex(phoneRegex, "Enter valid 10-digit mobile number")
      .optional()
      .or(z.literal("")),
    date_of_birth: z
      .string()
      .optional()
      .refine((value) => !isFutureDate(value), {
        message: "Date of birth cannot be in the future",
      }),
    gender: z
      .enum(["male", "female", "other", "prefer_not_to_say"])
      .optional(),
    consent_treatment: requiredConsent,
    consent_telehealth: requiredConsent,
    consent_terms: requiredConsent,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export const providerRegisterSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    specialty: z.string().min(1, "Specialty is required"),
    license_number: z.string().min(1, "License number is required"),
    license_state: z.string().min(1, "License state is required"),
    phone: z.string().regex(phoneRegex, "Enter valid 10-digit mobile number"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export const registerRoleSchema = z.enum(["patient", "provider"])

export const registerFormSchema = z
  .object({
    role: registerRoleSchema,
    full_name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .refine((value) => value === "" || phoneRegex.test(value), {
        message: "Enter valid 10-digit mobile number",
      }),
    date_of_birth: z
      .string()
      .refine((value) => value === "" || !isFutureDate(value), {
        message: "Date of birth cannot be in the future",
      }),
    gender: z
      .enum(["male", "female", "other", "prefer_not_to_say"])
      .optional(),
    specialty: z.string(),
    license_number: z.string(),
    license_state: z.string(),
    consent_treatment: z.boolean(),
    consent_telehealth: z.boolean(),
    consent_terms: z.boolean(),
  })
  .superRefine((data, context) => {
    if (data.password !== data.confirm_password) {
      context.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirm_password"],
      })
    }

    if (data.role === "provider") {
      if (!data.specialty.trim()) {
        context.addIssue({
          code: "custom",
          message: "Specialty is required",
          path: ["specialty"],
        })
      }

      if (!data.license_number.trim()) {
        context.addIssue({
          code: "custom",
          message: "License number is required",
          path: ["license_number"],
        })
      }

      if (!data.license_state.trim()) {
        context.addIssue({
          code: "custom",
          message: "License state is required",
          path: ["license_state"],
        })
      }

      if (!data.phone.trim()) {
        context.addIssue({
          code: "custom",
          message: "Enter valid 10-digit mobile number",
          path: ["phone"],
        })
      }
    }

    if (data.role === "patient") {
      if (!data.consent_treatment) {
        context.addIssue({
          code: "custom",
          message: consentMessage,
          path: ["consent_treatment"],
        })
      }

      if (!data.consent_telehealth) {
        context.addIssue({
          code: "custom",
          message: consentMessage,
          path: ["consent_telehealth"],
        })
      }

      if (!data.consent_terms) {
        context.addIssue({
          code: "custom",
          message: consentMessage,
          path: ["consent_terms"],
        })
      }
    }
  })

export const registerSchema = z.discriminatedUnion("role", [
  patientRegisterSchema.extend({
    role: z.literal("patient"),
  }),
  providerRegisterSchema.extend({
    consent_treatment: z.boolean().optional(),
    consent_telehealth: z.boolean().optional(),
    consent_terms: z.boolean().optional(),
    role: z.literal("provider"),
  }),
])

export type LoginInput = z.infer<typeof loginSchema>
export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>
export type ProviderRegisterInput = z.infer<typeof providerRegisterSchema>
export type RegisterFormInput = z.infer<typeof registerFormSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterRole = z.infer<typeof registerRoleSchema>
