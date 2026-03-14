"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  allergiesAndConditionsSchema,
  ehrRecordIdSchema,
  medicalHistorySchema,
  medicationSchema,
  prescriptionSchema,
} from "@/lib/validations/ehr"

type EHRActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

function cleanOptional(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function revalidateEHRPaths(patientId: string) {
  revalidatePath(`/patients/${patientId}`)
  revalidatePath(`/patients/${patientId}/ehr`)
  revalidatePath("/patients")
  revalidatePath("/dashboard")
  revalidatePath("/portal")
  revalidatePath("/portal/ehr")
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
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .single()

  if (error || !provider) {
    throw new Error("Unauthorized")
  }

  return provider
}

async function getPatientForProvider(patientId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle()

  if (error || !data) {
    throw new Error(error?.message ?? "Patient not found.")
  }

  return data
}

async function getMedicationOwner(medicationId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("medications")
    .select("id, patient_id, provider_id, name")
    .eq("id", medicationId)
    .maybeSingle()

  if (error || !data) {
    throw new Error(error?.message ?? "Medication not found.")
  }

  return data
}

async function getHistoryOwner(historyId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("medical_history")
    .select("id, patient_id")
    .eq("id", historyId)
    .maybeSingle()

  if (error || !data) {
    throw new Error(error?.message ?? "History record not found.")
  }

  return data
}

export async function addMedicationAction(
  patientId: string,
  input: unknown
): Promise<EHRActionResult> {
  const parsed = medicationSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  await getPatientForProvider(patientId)

  const admin = createAdminClient()
  const values = parsed.data
  const { error } = await admin.from("medications").insert({
    dosage: values.dosage,
    end_date: cleanOptional(values.end_date),
    frequency: values.frequency,
    is_active: cleanOptional(values.end_date) ? false : true,
    name: values.name,
    notes: cleanOptional(values.notes),
    patient_id: patientId,
    provider_id: provider.id,
    reason: cleanOptional(values.reason),
    route: values.route,
    start_date: values.start_date,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(patientId)

  return { success: true }
}

export async function updateMedicationAction(
  medicationId: string,
  input: unknown
): Promise<EHRActionResult> {
  const idParsed = ehrRecordIdSchema.safeParse({ id: medicationId })
  const parsed = medicationSchema.safeParse(input)

  if (!idParsed.success || !parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  const medication = await getMedicationOwner(medicationId)

  if (medication.provider_id !== provider.id) {
    return {
      error: "You can only edit medications that you created.",
    }
  }

  const admin = createAdminClient()
  const values = parsed.data
  const { error } = await admin
    .from("medications")
    .update({
      dosage: values.dosage,
      end_date: cleanOptional(values.end_date),
      frequency: values.frequency,
      is_active: cleanOptional(values.end_date) ? false : true,
      name: values.name,
      notes: cleanOptional(values.notes),
      reason: cleanOptional(values.reason),
      route: values.route,
      start_date: values.start_date,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicationId)
    .eq("provider_id", provider.id)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(medication.patient_id)

  return { success: true }
}

export async function stopMedicationAction(
  medicationId: string
): Promise<EHRActionResult> {
  const parsed = ehrRecordIdSchema.safeParse({ id: medicationId })

  if (!parsed.success) {
    return {
      error: "Invalid medication.",
    }
  }

  const provider = await getCurrentProvider()
  const medication = await getMedicationOwner(medicationId)

  if (medication.provider_id !== provider.id) {
    return {
      error: "You can only stop medications that you created.",
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("medications")
    .update({
      end_date: new Date().toISOString().split("T")[0],
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicationId)
    .eq("provider_id", provider.id)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(medication.patient_id)

  return { success: true }
}

export async function addMedicalHistoryAction(
  patientId: string,
  input: unknown
): Promise<EHRActionResult> {
  const parsed = medicalHistorySchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  await getPatientForProvider(patientId)

  const admin = createAdminClient()
  const values = parsed.data
  const { error } = await admin.from("medical_history").insert({
    date_occurred: cleanOptional(values.date_occurred),
    description: cleanOptional(values.description),
    history_type: values.history_type,
    is_resolved: values.is_resolved,
    patient_id: patientId,
    provider_id: provider.id,
    title: values.title,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(patientId)

  return { success: true }
}

export async function updateMedicalHistoryAction(
  historyId: string,
  input: unknown
): Promise<EHRActionResult> {
  const idParsed = ehrRecordIdSchema.safeParse({ id: historyId })
  const parsed = medicalHistorySchema.safeParse(input)

  if (!idParsed.success || !parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    }
  }

  await getCurrentProvider()
  const history = await getHistoryOwner(historyId)

  const admin = createAdminClient()
  const values = parsed.data
  const { error } = await admin
    .from("medical_history")
    .update({
      date_occurred: cleanOptional(values.date_occurred),
      description: cleanOptional(values.description),
      history_type: values.history_type,
      is_resolved: values.is_resolved,
      title: values.title,
    })
    .eq("id", historyId)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(history.patient_id)

  return { success: true }
}

export async function issuePrescriptionAction(
  patientId: string,
  input: unknown
): Promise<EHRActionResult> {
  const parsed = prescriptionSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  await getPatientForProvider(patientId)

  const admin = createAdminClient()
  const values = parsed.data
  const { error } = await admin.from("prescriptions").insert({
    appointment_id: cleanOptional(values.appointment_id),
    expires_at: cleanOptional(values.expires_at)
      ? new Date(`${values.expires_at}T23:59:59`).toISOString()
      : null,
    instructions: cleanOptional(values.instructions),
    medications: values.medications,
    patient_id: patientId,
    provider_id: provider.id,
    rx_number: "PENDING",
    status: "active",
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(patientId)

  return { success: true }
}

export async function updatePatientAllergiesAndConditionsAction(
  patientId: string,
  input: unknown
): Promise<EHRActionResult> {
  const parsed = allergiesAndConditionsSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  await getCurrentProvider()
  await getPatientForProvider(patientId)

  const admin = createAdminClient()
  const { error } = await admin
    .from("patients")
    .update({
      allergies: parsed.data.allergies,
      chronic_conditions: parsed.data.chronic_conditions,
    })
    .eq("id", patientId)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateEHRPaths(patientId)

  return { success: true }
}
