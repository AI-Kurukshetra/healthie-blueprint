import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Json, Tables } from "@/types/database"

export type EHRMedication = {
  dosage: string
  endDate: string | null
  frequency: string
  id: string
  isActive: boolean
  name: string
  notes: string | null
  reason: string | null
  route: string | null
  startDate: string
}

export type EHRMedicalHistoryRecord = {
  createdAt: string
  dateOccurred: string | null
  description: string | null
  historyType: string
  id: string
  isResolved: boolean
  title: string
}

export type PrescriptionMedicationEntry = {
  dosage: string
  duration: string
  frequency: string
  instructions: string
  name: string
}

export type EHRPrescription = {
  appointmentId: string | null
  createdAt: string
  expiresAt: string | null
  id: string
  instructions: string | null
  issuedAt: string
  medications: PrescriptionMedicationEntry[]
  rxNumber: string
  status: string
}

export type EHRAppointmentOption = {
  id: string
  label: string
}

export type PatientEHRSummary = {
  activeMedicationCount: number
  lastPrescription: {
    issuedAt: string
    rxNumber: string
  } | null
}

export type ProviderPatientEHRData = {
  activeMedications: EHRMedication[]
  allergies: string[]
  appointments: EHRAppointmentOption[]
  chronicConditions: string[]
  history: EHRMedicalHistoryRecord[]
  pastMedications: EHRMedication[]
  patientId: string
  patientName: string
  prescriptions: EHRPrescription[]
}

export type PatientPortalEHRData = {
  activeMedications: EHRMedication[]
  allergies: string[]
  chronicConditions: string[]
  history: EHRMedicalHistoryRecord[]
  prescriptions: EHRPrescription[]
}

type PatientLookup = Pick<
  Tables<"patients">,
  "allergies" | "chronic_conditions" | "id" | "profile_id"
>

type MedicationRow = Pick<
  Tables<"medications">,
  "dosage" | "end_date" | "frequency" | "id" | "is_active" | "name" | "notes" | "reason" | "route" | "start_date"
>

type MedicalHistoryRow = Pick<
  Tables<"medical_history">,
  "created_at" | "date_occurred" | "description" | "history_type" | "id" | "is_resolved" | "title"
>

type PrescriptionRow = Pick<
  Tables<"prescriptions">,
  "appointment_id" | "created_at" | "expires_at" | "id" | "instructions" | "issued_at" | "medications" | "rx_number" | "status"
>

function toMedication(medication: MedicationRow): EHRMedication {
  return {
    dosage: medication.dosage,
    endDate: medication.end_date,
    frequency: medication.frequency,
    id: medication.id,
    isActive: medication.is_active,
    name: medication.name,
    notes: medication.notes,
    reason: medication.reason,
    route: medication.route,
    startDate: medication.start_date,
  }
}

function toHistoryRecord(record: MedicalHistoryRow): EHRMedicalHistoryRecord {
  return {
    createdAt: record.created_at,
    dateOccurred: record.date_occurred,
    description: record.description,
    historyType: record.history_type,
    id: record.id,
    isResolved: record.is_resolved ?? false,
    title: record.title,
  }
}

function parsePrescriptionMedications(value: Json): PrescriptionMedicationEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((entry) => {
    const item: Record<string, Json | undefined> =
      entry && typeof entry === "object" && !Array.isArray(entry) ? entry : {}

    return {
      dosage: typeof item.dosage === "string" ? item.dosage : "",
      duration: typeof item.duration === "string" ? item.duration : "",
      frequency: typeof item.frequency === "string" ? item.frequency : "",
      instructions: typeof item.instructions === "string" ? item.instructions : "",
      name: typeof item.name === "string" ? item.name : "",
    }
  })
}

function toPrescription(prescription: PrescriptionRow): EHRPrescription {
  return {
    appointmentId: prescription.appointment_id,
    createdAt: prescription.created_at,
    expiresAt: prescription.expires_at,
    id: prescription.id,
    instructions: prescription.instructions,
    issuedAt: prescription.issued_at,
    medications: parsePrescriptionMedications(prescription.medications),
    rxNumber: prescription.rx_number,
    status: prescription.status,
  }
}

async function getPatientLookup(patientId: string): Promise<PatientLookup | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("patients")
    .select("id, profile_id, allergies, chronic_conditions")
    .eq("id", patientId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getPatientName(profileId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", profileId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data?.full_name ?? "Patient"
}

export async function getProviderPatientEHR(
  patientId: string
): Promise<ProviderPatientEHRData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (providerError || !provider) {
    throw new Error("Unauthorized")
  }

  const patient = await getPatientLookup(patientId)

  if (!patient) {
    return null
  }

  const patientName = await getPatientName(patient.profile_id)
  const admin = createAdminClient()
  const [medicationsResult, historyResult, prescriptionsResult, appointmentsResult] =
    await Promise.all([
      admin
        .from("medications")
        .select("dosage, end_date, frequency, id, is_active, name, notes, reason, route, start_date")
        .eq("patient_id", patientId)
        .order("is_active", { ascending: false })
        .order("start_date", { ascending: false }),
      admin
        .from("medical_history")
        .select("created_at, date_occurred, description, history_type, id, is_resolved, title")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      admin
        .from("prescriptions")
        .select("appointment_id, created_at, expires_at, id, instructions, issued_at, medications, rx_number, status")
        .eq("patient_id", patientId)
        .order("issued_at", { ascending: false }),
      admin
        .from("appointments")
        .select("id, scheduled_at, type")
        .eq("patient_id", patientId)
        .eq("provider_id", provider.id)
        .order("scheduled_at", { ascending: false })
        .limit(20),
    ])

  if (medicationsResult.error) {
    throw new Error(medicationsResult.error.message)
  }

  if (historyResult.error) {
    throw new Error(historyResult.error.message)
  }

  if (prescriptionsResult.error) {
    throw new Error(prescriptionsResult.error.message)
  }

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message)
  }

  const medications = (medicationsResult.data ?? []).map(toMedication)

  return {
    activeMedications: medications.filter((item) => item.isActive),
    allergies: patient.allergies ?? [],
    appointments: (appointmentsResult.data ?? []).map((appointment) => ({
      id: appointment.id,
      label: `${appointment.type.replace("_", " ")} · ${new Date(appointment.scheduled_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
    })),
    chronicConditions: patient.chronic_conditions ?? [],
    history: (historyResult.data ?? []).map(toHistoryRecord),
    pastMedications: medications.filter((item) => !item.isActive),
    patientId: patient.id,
    patientName,
    prescriptions: (prescriptionsResult.data ?? []).map(toPrescription),
  }
}

export async function getPatientPortalEHR(
  patientId: string
): Promise<PatientPortalEHRData> {
  const supabase = await createClient()
  const [patientResult, medicationsResult, historyResult, prescriptionsResult] =
    await Promise.all([
      supabase
        .from("patients")
        .select("allergies, chronic_conditions")
        .eq("id", patientId)
        .single(),
      supabase
        .from("medications")
        .select("dosage, end_date, frequency, id, is_active, name, notes, reason, route, start_date")
        .eq("patient_id", patientId)
        .eq("is_active", true)
        .order("start_date", { ascending: false }),
      supabase
        .from("medical_history")
        .select("created_at, date_occurred, description, history_type, id, is_resolved, title")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("prescriptions")
        .select("appointment_id, created_at, expires_at, id, instructions, issued_at, medications, rx_number, status")
        .eq("patient_id", patientId)
        .order("issued_at", { ascending: false }),
    ])

  if (patientResult.error) {
    throw new Error(patientResult.error.message)
  }

  if (medicationsResult.error) {
    throw new Error(medicationsResult.error.message)
  }

  if (historyResult.error) {
    throw new Error(historyResult.error.message)
  }

  if (prescriptionsResult.error) {
    throw new Error(prescriptionsResult.error.message)
  }

  return {
    activeMedications: (medicationsResult.data ?? []).map(toMedication),
    allergies: patientResult.data.allergies ?? [],
    chronicConditions: patientResult.data.chronic_conditions ?? [],
    history: (historyResult.data ?? []).map(toHistoryRecord),
    prescriptions: (prescriptionsResult.data ?? []).map(toPrescription),
  }
}

export async function getPatientEHRSummary(
  patientId: string
): Promise<PatientEHRSummary> {
  const admin = createAdminClient()
  const [{ count, error: medicationError }, { data: prescription, error: prescriptionError }] =
    await Promise.all([
      admin
        .from("medications")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patientId)
        .eq("is_active", true),
      admin
        .from("prescriptions")
        .select("rx_number, issued_at")
        .eq("patient_id", patientId)
        .order("issued_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

  if (medicationError) {
    throw new Error(medicationError.message)
  }

  if (prescriptionError) {
    throw new Error(prescriptionError.message)
  }

  return {
    activeMedicationCount: count ?? 0,
    lastPrescription: prescription
      ? {
          issuedAt: prescription.issued_at,
          rxNumber: prescription.rx_number,
        }
      : null,
  }
}
