import { z } from "zod"

export const careTeamRoleSchema = z.enum([
  "primary",
  "secondary",
  "specialist",
  "consultant",
])

export const careTeamSchema = z.object({
  patient_id: z.string().uuid("Invalid patient"),
  provider_id: z.string().uuid("Select a provider"),
  role: careTeamRoleSchema,
})

export const removeCareTeamSchema = z.object({
  patient_id: z.string().uuid("Invalid patient"),
  provider_id: z.string().uuid("Invalid provider"),
})

export type CareTeamInput = z.infer<typeof careTeamSchema>
export type CareTeamRole = z.infer<typeof careTeamRoleSchema>
