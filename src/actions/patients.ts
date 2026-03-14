"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { patientIdSchema, patientSchema } from "@/lib/validations/patient"

type PatientActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  patientId?: string
  success?: boolean
}

const ACTIVE_APPOINTMENT_STATUSES = ["scheduled", "confirmed", "in_progress"] as const

function cleanOptional(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getFullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`
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

async function getNextPatientId() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("patients")
    .select("patient_id")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  const latestValue = data?.[0]?.patient_id
  const latestNumber = latestValue ? Number.parseInt(latestValue.split("-")[1] ?? "0", 10) : 0

  return `PAT-${String(latestNumber + 1).padStart(3, "0")}`
}

function randomTemporaryPassword() {
  return `Temp${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}A1`
}

export async function createPatientAction(input: unknown): Promise<PatientActionResult> {
  const parsed = patientSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  const admin = createAdminClient()
  const values = parsed.data
  const fullName = getFullName(values.first_name, values.last_name)

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: values.email,
    email_confirm: true,
    password: randomTemporaryPassword(),
    user_metadata: {
      full_name: fullName,
      role: "patient",
    },
  })

  if (authError || !authUser.user) {
    return {
      error: authError?.message ?? "Unable to create patient account.",
    }
  }

  const userId = authUser.user.id

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      date_of_birth: cleanOptional(values.date_of_birth),
      email: values.email,
      full_name: fullName,
      gender: values.gender ?? null,
      phone: cleanOptional(values.phone),
      role: "patient",
    })
    .eq("id", userId)

  if (profileError) {
    return {
      error: profileError.message,
    }
  }

  const patientId = await getNextPatientId()
  const { data: patient, error: patientError } = await admin
    .from("patients")
    .insert({
      allergies: values.allergies,
      blood_group: values.blood_group ?? null,
      chronic_conditions: values.chronic_conditions,
      emergency_contact: cleanOptional(values.emergency_contact),
      emergency_phone: cleanOptional(values.emergency_phone),
      insurance_id: cleanOptional(values.insurance_id),
      insurance_provider: cleanOptional(values.insurance_provider),
      patient_id: patientId,
      primary_provider_id: provider.id,
      profile_id: userId,
    })
    .select("id")
    .single()

  if (patientError || !patient) {
    return {
      error: patientError?.message ?? "Unable to create patient record.",
    }
  }

  revalidatePath("/patients")
  revalidatePath("/dashboard")

  return {
    patientId: patient.id,
    success: true,
  }
}

export async function updatePatientAction(
  patientId: string,
  input: unknown
): Promise<PatientActionResult> {
  const idParsed = patientIdSchema.safeParse({ id: patientId })
  const parsed = patientSchema.safeParse(input)

  if (!idParsed.success || !parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.success ? undefined : parsed.error.flatten().fieldErrors,
    }
  }

  await getCurrentProvider()
  const admin = createAdminClient()
  const values = parsed.data
  const fullName = getFullName(values.first_name, values.last_name)
  const { data: currentPatient, error: patientLookupError } = await admin
    .from("patients")
    .select("id, profile_id")
    .eq("id", patientId)
    .single()

  if (patientLookupError || !currentPatient) {
    return {
      error: patientLookupError?.message ?? "Patient not found.",
    }
  }

  const { error: authError } = await admin.auth.admin.updateUserById(currentPatient.profile_id, {
    email: values.email,
    user_metadata: {
      full_name: fullName,
      role: "patient",
    },
  })

  if (authError) {
    return {
      error: authError.message,
    }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      date_of_birth: cleanOptional(values.date_of_birth),
      email: values.email,
      full_name: fullName,
      gender: values.gender ?? null,
      phone: cleanOptional(values.phone),
    })
    .eq("id", currentPatient.profile_id)

  if (profileError) {
    return {
      error: profileError.message,
    }
  }

  const { error: patientError } = await admin
    .from("patients")
    .update({
      allergies: values.allergies,
      blood_group: values.blood_group ?? null,
      chronic_conditions: values.chronic_conditions,
      emergency_contact: cleanOptional(values.emergency_contact),
      emergency_phone: cleanOptional(values.emergency_phone),
      insurance_id: cleanOptional(values.insurance_id),
      insurance_provider: cleanOptional(values.insurance_provider),
    })
    .eq("id", patientId)

  if (patientError) {
    return {
      error: patientError.message,
    }
  }

  revalidatePath("/patients")
  revalidatePath(`/patients/${patientId}`)
  revalidatePath(`/patients/${patientId}/edit`)

  return {
    patientId,
    success: true,
  }
}

export async function deletePatientAction(patientId: string): Promise<PatientActionResult> {
  const idParsed = patientIdSchema.safeParse({ id: patientId })

  if (!idParsed.success) {
    return {
      error: "Invalid patient.",
    }
  }

  await getCurrentProvider()
  const admin = createAdminClient()
  const { data: patient, error } = await admin
    .from("patients")
    .select("id, profile_id")
    .eq("id", patientId)
    .single()

  if (error || !patient) {
    return {
      error: error?.message ?? "Patient not found.",
    }
  }

  const { count, error: appointmentError } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .in("status", [...ACTIVE_APPOINTMENT_STATUSES])

  if (appointmentError) {
    return {
      error: appointmentError.message,
    }
  }

  if ((count ?? 0) > 0) {
    return {
      error: `Cannot delete patient — they have ${count} active appointment(s). Cancel all appointments first.`,
    }
  }

  await admin.from("messages").delete().eq("patient_id", patientId)
  await admin.from("messages").delete().eq("sender_id", patient.profile_id)
  await admin.from("messages").delete().eq("receiver_id", patient.profile_id)
  await admin.from("notifications").delete().eq("user_id", patient.profile_id)

  const { error: authError } = await admin.auth.admin.deleteUser(patient.profile_id)

  if (authError) {
    return {
      error: authError.message,
    }
  }

  revalidatePath("/patients")
  revalidatePath("/dashboard")

  return {
    success: true,
  }
}
