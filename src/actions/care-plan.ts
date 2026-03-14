"use server"

import { revalidatePath } from "next/cache"

import { getActiveCarePlan, getLatestCarePlan } from "@/lib/data/care-plan"
import { createClient } from "@/lib/supabase/server"
import {
  carePlanSchema,
  carePlanStatusSchema,
  carePlanStatusUpdateSchema,
  type CarePlanStatus,
} from "@/lib/validations/care-plan"

type CarePlanActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

async function getCurrentProviderId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: provider, error } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!provider) {
    throw new Error("Provider profile missing")
  }

  return { providerId: provider.id, supabase }
}

export async function getCarePlan(patientId: string) {
  const activePlan = await getActiveCarePlan(patientId)

  if (activePlan) {
    return activePlan
  }

  return getLatestCarePlan(patientId)
}

export async function saveCarePlan(
  patientId: string,
  input: unknown,
  statusOverride?: CarePlanStatus
): Promise<CarePlanActionResult> {
  const parsed = carePlanSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const resolvedStatus = carePlanStatusSchema.parse(statusOverride ?? parsed.data.status)

  try {
    const { providerId, supabase } = await getCurrentProviderId()
    const { data: existingPlan, error: existingError } = await supabase
      .from("care_plans")
      .select("id")
      .eq("patient_id", patientId)
      .eq("provider_id", providerId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingError) {
      return {
        error: existingError.message,
      }
    }

    if (!existingPlan) {
      const { data: activePlan, error: activePlanError } = await supabase
        .from("care_plans")
        .select("id, title")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .maybeSingle()

      if (activePlanError) {
        return {
          error: activePlanError.message,
        }
      }

      if (activePlan) {
        return {
          error: `Patient already has an active care plan: "${activePlan.title}". Please complete or pause it before creating a new one.`,
        }
      }
    }

    const payload = {
      diet_notes: parsed.data.diet_notes || null,
      end_date: parsed.data.end_date || null,
      exercise: parsed.data.exercise || null,
      follow_up: parsed.data.follow_up || null,
      goals: parsed.data.goals,
      instructions: parsed.data.instructions || null,
      patient_id: patientId,
      provider_id: providerId,
      start_date: parsed.data.start_date,
      status: resolvedStatus,
      title: parsed.data.title,
    }

    const query = existingPlan
      ? supabase.from("care_plans").update(payload).eq("id", existingPlan.id)
      : supabase.from("care_plans").insert(payload)
    const { error } = await query

    if (error) {
      return {
        error: error.message,
      }
    }

    revalidatePath(`/patients/${patientId}`)
    revalidatePath(`/patients/${patientId}/care-plan`)
    revalidatePath("/portal")
    revalidatePath("/portal/care-plan")

    return {
      success: true,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save care plan.",
    }
  }
}

export async function updateCarePlanStatus(input: unknown): Promise<CarePlanActionResult> {
  const parsed = carePlanStatusUpdateSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Invalid care plan status update.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const { supabase } = await getCurrentProviderId()
    const { error } = await supabase
      .from("care_plans")
      .update({
        status: parsed.data.status,
      })
      .eq("id", parsed.data.id)

    if (error) {
      return {
        error: error.message,
      }
    }

    revalidatePath("/portal")
    revalidatePath("/portal/care-plan")

    return {
      success: true,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update care plan status.",
    }
  }
}
