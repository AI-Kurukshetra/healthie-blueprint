"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { noteIdSchema, soapNoteSchema } from "@/lib/validations/note"

type NoteActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  noteId?: string
  success?: boolean
}

type NoteActionMode = "draft" | "sign"

function isBlank(value: string | null | undefined) {
  return !value || value.trim() === ""
}

function normalizeNumber(value?: string) {
  if (!value || value.trim() === "") {
    return undefined
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}

function normalizePayload(input: Record<string, unknown>) {
  return {
    appointment_id:
      typeof input.appointment_id === "string" && input.appointment_id.trim() !== ""
        ? input.appointment_id
        : undefined,
    assessment: input.assessment,
    bp_diastolic: normalizeNumber(input.bp_diastolic as string | undefined),
    bp_systolic: normalizeNumber(input.bp_systolic as string | undefined),
    diagnosis_codes: Array.isArray(input.diagnosis_codes) ? input.diagnosis_codes : [],
    heart_rate: normalizeNumber(input.heart_rate as string | undefined),
    height: normalizeNumber(input.height as string | undefined),
    objective: input.objective,
    oxygen_sat: normalizeNumber(input.oxygen_sat as string | undefined),
    patient_id: input.patient_id,
    plan: input.plan,
    subjective: input.subjective,
    temperature: normalizeNumber(input.temperature as string | undefined),
    weight: normalizeNumber(input.weight as string | undefined),
  }
}

async function getCurrentProvider() {
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
    .single()

  if (error || !provider) {
    throw new Error("Unauthorized")
  }

  return provider
}

async function upsertNote(
  mode: NoteActionMode,
  noteId: string | undefined,
  input: unknown
): Promise<NoteActionResult> {
  const normalized = normalizePayload(input as Record<string, unknown>)
  const parsed = soapNoteSchema.safeParse(normalized)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  const supabase = await createClient()

  if (
    mode === "sign" &&
    (isBlank(parsed.data.subjective) ||
      isBlank(parsed.data.assessment) ||
      isBlank(parsed.data.plan))
  ) {
    return {
      error:
        "Cannot sign an incomplete note. Subjective, Assessment and Plan are required.",
    }
  }

  const payload = {
    ...parsed.data,
    note_type: "soap",
    provider_id: provider.id,
    signed_at: mode === "sign" ? new Date().toISOString() : null,
    status: mode === "sign" ? "signed" : "draft",
  }

  if (!noteId) {
    const { data, error } = await supabase
      .from("clinical_notes")
      .insert(payload)
      .select("id")
      .single()

    if (error || !data) {
      return {
        error: error?.message ?? "Unable to save note.",
      }
    }

    revalidatePath("/notes")
    revalidatePath(`/notes/${data.id}`)
    revalidatePath(`/patients/${parsed.data.patient_id}`)
    revalidatePath("/portal/records")

    return {
      noteId: data.id,
      success: true,
    }
  }

  const idParsed = noteIdSchema.safeParse({ id: noteId })

  if (!idParsed.success) {
    return {
      error: "Invalid note.",
    }
  }

  const { data: existing, error: lookupError } = await supabase
    .from("clinical_notes")
    .select("id, patient_id, provider_id, status")
    .eq("id", noteId)
    .single()

  if (lookupError || !existing) {
    return {
      error: lookupError?.message ?? "Note not found.",
    }
  }

  if (existing.status === "signed") {
    return {
      error: "Signed notes cannot be edited.",
    }
  }

  if (mode === "sign" && existing.provider_id !== provider.id) {
    return {
      error: "You can only sign your own notes.",
    }
  }

  const { error } = await supabase
    .from("clinical_notes")
    .update(payload)
    .eq("id", noteId)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidatePath("/notes")
  revalidatePath(`/notes/${noteId}`)
  revalidatePath(`/patients/${existing.patient_id}`)
  revalidatePath("/portal/records")

  return {
    noteId,
    success: true,
  }
}

export async function saveDraftNoteAction(
  noteId: string | undefined,
  input: unknown
): Promise<NoteActionResult> {
  return upsertNote("draft", noteId, input)
}

export async function signNoteAction(
  noteId: string | undefined,
  input: unknown
): Promise<NoteActionResult> {
  return upsertNote("sign", noteId, input)
}
