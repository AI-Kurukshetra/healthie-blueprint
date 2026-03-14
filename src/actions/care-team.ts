"use server"

import { revalidatePath } from "next/cache"

import { getCareTeam as getCareTeamData } from "@/lib/data/care-team"
import { createClient } from "@/lib/supabase/server"
import {
  careTeamSchema,
  removeCareTeamSchema,
} from "@/lib/validations/care-team"

type CareTeamActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

async function assertUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return { supabase, user }
}

export async function addCareTeamMember(input: unknown): Promise<CareTeamActionResult> {
  const parsed = careTeamSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const { supabase } = await assertUser()
    const { error } = await supabase.from("care_team").insert(parsed.data)

    if (error) {
      return {
        error:
          error.code === "23505"
            ? "This provider is already on the care team."
            : error.message,
      }
    }

    revalidatePath(`/patients/${parsed.data.patient_id}`)
    revalidatePath(`/patients/${parsed.data.patient_id}/care-team`)

    return {
      success: true,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to add care team member.",
    }
  }
}

export async function removeCareTeamMember(input: unknown): Promise<CareTeamActionResult> {
  const parsed = removeCareTeamSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Invalid care team member.",
    }
  }

  try {
    const { supabase } = await assertUser()
    const { error } = await supabase
      .from("care_team")
      .delete()
      .eq("patient_id", parsed.data.patient_id)
      .eq("provider_id", parsed.data.provider_id)

    if (error) {
      return {
        error: error.message,
      }
    }

    revalidatePath(`/patients/${parsed.data.patient_id}`)
    revalidatePath(`/patients/${parsed.data.patient_id}/care-team`)

    return {
      success: true,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to remove care team member.",
    }
  }
}

export async function getCareTeam(patientId: string) {
  return getCareTeamData(patientId)
}
