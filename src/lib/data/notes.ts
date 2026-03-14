import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type NoteRow = Pick<
  Tables<"clinical_notes">,
  | "appointment_id"
  | "assessment"
  | "bp_diastolic"
  | "bp_systolic"
  | "created_at"
  | "diagnosis_codes"
  | "heart_rate"
  | "height"
  | "id"
  | "objective"
  | "oxygen_sat"
  | "patient_id"
  | "plan"
  | "provider_id"
  | "signed_at"
  | "status"
  | "subjective"
  | "temperature"
  | "weight"
>

type PatientRow = Pick<Tables<"patients">, "id" | "patient_id" | "profile_id">
type ProfileRow = Pick<Tables<"profiles">, "avatar_url" | "full_name" | "id">
type AppointmentRow = Pick<Tables<"appointments">, "id" | "reason" | "scheduled_at" | "status" | "type">

export type NoteListItem = {
  createdAt: string
  diagnosisCodes: string[]
  id: string
  patientId: string
  patientName: string
  signedAt: string | null
  status: string
  type: string
}

export type NoteDetail = {
  appointment: AppointmentRow | null
  createdAt: string
  diagnosisCodes: string[]
  formValues: {
    appointment_id: string
    assessment: string
    bp_diastolic: string
    bp_systolic: string
    diagnosis_codes: string[]
    heart_rate: string
    height: string
    objective: string
    oxygen_sat: string
    patient_id: string
    plan: string
    subjective: string
    temperature: string
    weight: string
  }
  id: string
  patient: {
    avatarUrl: string | null
    id: string
    patientId: string
    patientName: string
  }
  signedAt: string | null
  status: string
}

export type NotePatientOption = {
  id: string
  patientId: string
  patientName: string
}

export type NoteAppointmentOption = {
  id: string
  label: string
  patientId: string
}

async function getProfilesByIds(profileIds: string[]) {
  const supabase = await createClient()

  if (profileIds.length === 0) {
    return new Map<string, ProfileRow>()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url, full_name")
    .in("id", profileIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

export async function getNotePatients(): Promise<NotePatientOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_id, profile_id")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const patients = (data ?? []) as PatientRow[]
  const profiles = await getProfilesByIds(patients.map((patient) => patient.profile_id))

  return patients.map((patient) => ({
    id: patient.id,
    patientId: patient.patient_id,
    patientName: profiles.get(patient.profile_id)?.full_name ?? "Patient",
  }))
}

export async function getOpenAppointmentsForNotes(
  providerId: string
): Promise<NoteAppointmentOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("appointments")
    .select("id, patient_id, reason, scheduled_at, status, type")
    .eq("provider_id", providerId)
    .order("scheduled_at", { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(error.message)
  }

  const appointments = (data ?? []) as (AppointmentRow & { patient_id: string })[]
  const patients = await getNotePatients()
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]))

  return appointments.map((appointment) => ({
    id: appointment.id,
    label: `${patientMap.get(appointment.patient_id)?.patientName ?? "Patient"} | ${
      appointment.reason ?? appointment.type
    }`,
    patientId: appointment.patient_id,
  }))
}

export async function getProviderNotes(providerId: string): Promise<NoteListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clinical_notes")
    .select(
      "appointment_id, assessment, bp_diastolic, bp_systolic, created_at, diagnosis_codes, heart_rate, height, id, objective, oxygen_sat, patient_id, plan, provider_id, signed_at, status, subjective, temperature, weight"
    )
    .eq("provider_id", providerId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const notes = (data ?? []) as NoteRow[]
  const patients = await getNotePatients()
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]))

  return notes.map((note) => ({
    createdAt: note.created_at,
    diagnosisCodes: note.diagnosis_codes ?? [],
    id: note.id,
    patientId: patientMap.get(note.patient_id)?.patientId ?? "Unknown",
    patientName: patientMap.get(note.patient_id)?.patientName ?? "Patient",
    signedAt: note.signed_at,
    status: note.status,
    type: "SOAP",
  }))
}

export async function getNoteDetail(noteId: string): Promise<NoteDetail | null> {
  const supabase = await createClient()
  const { data: note, error } = await supabase
    .from("clinical_notes")
    .select(
      "appointment_id, assessment, bp_diastolic, bp_systolic, created_at, diagnosis_codes, heart_rate, height, id, objective, oxygen_sat, patient_id, plan, provider_id, signed_at, status, subjective, temperature, weight"
    )
    .eq("id", noteId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!note) {
    return null
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, patient_id, profile_id")
    .eq("id", note.patient_id)
    .single()

  if (patientError) {
    throw new Error(patientError.message)
  }

  const profiles = await getProfilesByIds([patient.profile_id])
  const profile = profiles.get(patient.profile_id)

  let appointment: AppointmentRow | null = null

  if (note.appointment_id) {
    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, reason, scheduled_at, status, type")
      .eq("id", note.appointment_id)
      .maybeSingle()

    if (appointmentError) {
      throw new Error(appointmentError.message)
    }

    appointment = appointmentData
  }

  return {
    appointment,
    createdAt: note.created_at,
    diagnosisCodes: note.diagnosis_codes ?? [],
    formValues: {
      appointment_id: note.appointment_id ?? "",
      assessment: note.assessment ?? "",
      bp_diastolic: note.bp_diastolic?.toString() ?? "",
      bp_systolic: note.bp_systolic?.toString() ?? "",
      diagnosis_codes: note.diagnosis_codes ?? [],
      heart_rate: note.heart_rate?.toString() ?? "",
      height: note.height?.toString() ?? "",
      objective: note.objective ?? "",
      oxygen_sat: note.oxygen_sat?.toString() ?? "",
      patient_id: note.patient_id,
      plan: note.plan ?? "",
      subjective: note.subjective ?? "",
      temperature: note.temperature?.toString() ?? "",
      weight: note.weight?.toString() ?? "",
    },
    id: note.id,
    patient: {
      avatarUrl: profile?.avatar_url ?? null,
      id: patient.id,
      patientId: patient.patient_id,
      patientName: profile?.full_name ?? "Patient",
    },
    signedAt: note.signed_at,
    status: note.status,
  }
}
