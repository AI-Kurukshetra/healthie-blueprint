import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type CarePlanRow = Pick<
  Tables<"care_plans">,
  | "created_at"
  | "diet_notes"
  | "end_date"
  | "exercise"
  | "follow_up"
  | "goals"
  | "id"
  | "instructions"
  | "patient_id"
  | "provider_id"
  | "start_date"
  | "status"
  | "title"
  | "updated_at"
>

type ProviderRow = Pick<Tables<"providers">, "id" | "profile_id" | "specialty">
type ProfileRow = Pick<Tables<"profiles">, "email" | "full_name" | "id">

export type CarePlanSummary = {
  dietNotes: string
  endDate: string | null
  exercise: string
  followUp: string
  goals: string
  id: string
  instructions: string
  patientId: string
  providerEmail: string
  providerId: string
  providerName: string
  providerSpecialty: string
  startDate: string
  status: string
  title: string
  updatedAt: string
}

async function getProviderContext(providerId: string) {
  const admin = createAdminClient()
  const { data: provider, error } = await admin
    .from("providers")
    .select("id, profile_id, specialty")
    .eq("id", providerId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", provider.profile_id)
    .single()

  if (profileError) {
    throw new Error(profileError.message)
  }

  return {
    profile: profile as ProfileRow,
    provider: provider as ProviderRow,
  }
}

async function mapCarePlan(plan: CarePlanRow): Promise<CarePlanSummary> {
  const provider = await getProviderContext(plan.provider_id)

  return {
    dietNotes: plan.diet_notes ?? "",
    endDate: plan.end_date,
    exercise: plan.exercise ?? "",
    followUp: plan.follow_up ?? "",
    goals: plan.goals ?? "",
    id: plan.id,
    instructions: plan.instructions ?? "",
    patientId: plan.patient_id,
    providerEmail: provider.profile.email,
    providerId: plan.provider_id,
    providerName: provider.profile.full_name,
    providerSpecialty: provider.provider.specialty,
    startDate: plan.start_date,
    status: plan.status,
    title: plan.title,
    updatedAt: plan.updated_at,
  }
}

export async function getLatestCarePlan(patientId: string): Promise<CarePlanSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("care_plans")
    .select(
      "created_at, diet_notes, end_date, exercise, follow_up, goals, id, instructions, patient_id, provider_id, start_date, status, title, updated_at"
    )
    .eq("patient_id", patientId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return mapCarePlan(data as CarePlanRow)
}

export async function getActiveCarePlan(patientId: string): Promise<CarePlanSummary | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("care_plans")
    .select(
      "created_at, diet_notes, end_date, exercise, follow_up, goals, id, instructions, patient_id, provider_id, start_date, status, title, updated_at"
    )
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return mapCarePlan(data as CarePlanRow)
}
