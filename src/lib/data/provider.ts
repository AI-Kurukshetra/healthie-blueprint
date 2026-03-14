import "server-only"

import { differenceInYears, isAfter, isBefore, startOfDay } from "date-fns"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type PatientRow = Pick<
  Tables<"patients">,
  | "id"
  | "profile_id"
  | "patient_id"
  | "blood_group"
  | "allergies"
  | "chronic_conditions"
  | "emergency_contact"
  | "emergency_phone"
  | "insurance_provider"
  | "insurance_id"
  | "primary_provider_id"
  | "created_at"
>

type ProfileRow = Pick<
  Tables<"profiles">,
  | "id"
  | "avatar_url"
  | "date_of_birth"
  | "email"
  | "full_name"
  | "gender"
  | "phone"
>

type AppointmentRow = Pick<
  Tables<"appointments">,
  | "booked_by"
  | "id"
  | "cancel_reason"
  | "duration"
  | "meeting_room_id"
  | "patient_id"
  | "provider_id"
  | "reason"
  | "scheduled_at"
  | "status"
  | "type"
>

type NoteRow = Pick<
  Tables<"clinical_notes">,
  "id" | "created_at" | "diagnosis_codes" | "patient_id" | "signed_at" | "status"
>

type MessageRow = Pick<
  Tables<"messages">,
  "content" | "created_at" | "id" | "is_read" | "patient_id" | "receiver_id" | "sender_id"
>

export type ProviderPatientListItem = {
  age: number | null
  allergies: string[]
  avatarUrl: string | null
  bloodGroup: string | null
  chronicConditions: string[]
  dateOfBirth: string | null
  email: string
  emergencyContact: string | null
  emergencyPhone: string | null
  fullName: string
  gender: string | null
  id: string
  insuranceId: string | null
  insuranceProvider: string | null
  lastVisit: string | null
  patientId: string
  phone: string | null
  profileId: string
  status: "active" | "monitoring" | "new"
}

export type ProviderPatientDetail = ProviderPatientListItem & {
  appointments: ProviderPatientAppointment[]
  messages: ProviderPatientMessage[]
  notes: ProviderPatientNote[]
}

export type ProviderPatientNote = {
  createdAt: string
  diagnosisCodes: string[]
  id: string
  signedAt: string | null
  status: string
}

export type ProviderPatientMessage = {
  content: string
  createdAt: string
  id: string
  isRead: boolean
  senderLabel: string
}

export type ProviderPatientAppointment = {
  bookedBy: string
  duration: number
  id: string
  reason: string | null
  scheduledAt: string
  status: string
  type: string
}

export type ProviderAppointmentListItem = {
  bookedBy: string
  cancelReason: string | null
  duration: number
  id: string
  meetingRoomId: string | null
  patientAvatarUrl: string | null
  patientId: string
  patientName: string
  reason: string | null
  scheduledAt: string
  status: string
  type: string
}

type ProviderProfile = Pick<Tables<"providers">, "available_days" | "id" | "slot_duration">

async function getProfilesByIds(profileIds: string[]) {
  const supabase = await createClient()

  if (profileIds.length === 0) {
    return new Map<string, ProfileRow>()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url, date_of_birth, email, full_name, gender, phone")
    .in("id", profileIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

function getAge(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return null
  }

  return differenceInYears(new Date(), new Date(dateOfBirth))
}

function getPatientStatus(patient: PatientRow, latestVisit: string | null) {
  if (latestVisit && isAfter(new Date(latestVisit), startOfDay(new Date()))) {
    return "active" as const
  }

  if (latestVisit) {
    return "active" as const
  }

  if ((patient.chronic_conditions ?? []).length > 0) {
    return "monitoring" as const
  }

  return "new" as const
}

function buildPatientListItem(
  patient: PatientRow,
  profile: ProfileRow | undefined,
  lastVisit: string | null
): ProviderPatientListItem {
  return {
    age: getAge(profile?.date_of_birth ?? null),
    allergies: patient.allergies ?? [],
    avatarUrl: profile?.avatar_url ?? null,
    bloodGroup: patient.blood_group,
    chronicConditions: patient.chronic_conditions ?? [],
    dateOfBirth: profile?.date_of_birth ?? null,
    email: profile?.email ?? "",
    emergencyContact: patient.emergency_contact,
    emergencyPhone: patient.emergency_phone,
    fullName: profile?.full_name ?? "Patient",
    gender: profile?.gender ?? null,
    id: patient.id,
    insuranceId: patient.insurance_id,
    insuranceProvider: patient.insurance_provider,
    lastVisit,
    patientId: patient.patient_id,
    phone: profile?.phone ?? null,
    profileId: patient.profile_id,
    status: getPatientStatus(patient, lastVisit),
  }
}

export async function getProviderProfile(userId: string): Promise<ProviderProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("providers")
    .select("id, available_days, slot_duration")
    .eq("profile_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getProviderPatients() {
  const supabase = await createClient()
  const { data: patients, error } = await supabase
    .from("patients")
    .select(
      "id, profile_id, patient_id, blood_group, allergies, chronic_conditions, emergency_contact, emergency_phone, insurance_provider, insurance_id, primary_provider_id, created_at"
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const patientRows = (patients ?? []) as PatientRow[]
  const profiles = await getProfilesByIds(patientRows.map((patient) => patient.profile_id))
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("patient_id, scheduled_at, status")
    .in("patient_id", patientRows.map((patient) => patient.id))

  if (appointmentsError) {
    throw new Error(appointmentsError.message)
  }

  const latestVisits = new Map<string, string | null>()

  for (const appointment of appointments ?? []) {
    const existing = latestVisits.get(appointment.patient_id)

    if (!existing || isAfter(new Date(appointment.scheduled_at), new Date(existing))) {
      latestVisits.set(appointment.patient_id, appointment.scheduled_at)
    }
  }

  return patientRows.map((patient) =>
    buildPatientListItem(patient, profiles.get(patient.profile_id), latestVisits.get(patient.id) ?? null)
  )
}

export async function getPatientDetail(patientId: string): Promise<ProviderPatientDetail | null> {
  const supabase = await createClient()
  const { data: patient, error } = await supabase
    .from("patients")
    .select(
      "id, profile_id, patient_id, blood_group, allergies, chronic_conditions, emergency_contact, emergency_phone, insurance_provider, insurance_id, primary_provider_id, created_at"
    )
    .eq("id", patientId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!patient) {
    return null
  }

  const profileMap = await getProfilesByIds([patient.profile_id])
  const profile = profileMap.get(patient.profile_id)

  const [appointmentsResult, notesResult, messagesResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "booked_by, id, duration, reason, scheduled_at, status, type, patient_id, provider_id, meeting_room_id, cancel_reason"
      )
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false })
      .limit(8),
    supabase
      .from("clinical_notes")
      .select("id, created_at, diagnosis_codes, patient_id, signed_at, status")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("messages")
      .select("content, created_at, id, is_read, patient_id, receiver_id, sender_id")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message)
  }

  if (notesResult.error) {
    throw new Error(notesResult.error.message)
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message)
  }

  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[]
  const lastVisit = appointments[0]?.scheduled_at ?? null
  const detail = buildPatientListItem(patient as PatientRow, profile, lastVisit)
  const participantIds = [
    ...new Set(
      (messagesResult.data ?? []).flatMap((message) => [message.sender_id, message.receiver_id])
    ),
  ]
  const participantProfiles = await getProfilesByIds(participantIds)

  return {
    ...detail,
    appointments: appointments.map((appointment) => ({
      bookedBy: appointment.booked_by,
      duration: appointment.duration,
      id: appointment.id,
      reason: appointment.reason,
      scheduledAt: appointment.scheduled_at,
      status: appointment.status,
      type: appointment.type,
    })),
    messages: ((messagesResult.data ?? []) as MessageRow[]).map((message) => ({
      content: message.content,
      createdAt: message.created_at,
      id: message.id,
      isRead: message.is_read,
      senderLabel:
        participantProfiles.get(message.sender_id)?.full_name ??
        participantProfiles.get(message.receiver_id)?.full_name ??
        "Care team",
    })),
    notes: ((notesResult.data ?? []) as NoteRow[]).map((note) => ({
      createdAt: note.created_at,
      diagnosisCodes: note.diagnosis_codes ?? [],
      id: note.id,
      signedAt: note.signed_at,
      status: note.status,
    })),
  }
}

export async function getProviderAppointments(providerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "booked_by, id, cancel_reason, duration, meeting_room_id, patient_id, provider_id, reason, scheduled_at, status, type"
    )
    .eq("provider_id", providerId)
    .order("scheduled_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const appointments = (data ?? []) as AppointmentRow[]
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, profile_id, patient_id")
    .in("id", appointments.map((appointment) => appointment.patient_id))

  if (patientsError) {
    throw new Error(patientsError.message)
  }

  const patientRows = patients ?? []
  const profiles = await getProfilesByIds(patientRows.map((patient) => patient.profile_id))
  const patientMap = new Map(
    patientRows.map((patient) => [
      patient.id,
      {
        avatarUrl: profiles.get(patient.profile_id)?.avatar_url ?? null,
        patientId: patient.patient_id,
        patientName: profiles.get(patient.profile_id)?.full_name ?? "Patient",
      },
    ])
  )

  return appointments.map((appointment) => ({
    bookedBy: appointment.booked_by,
    cancelReason: appointment.cancel_reason,
    duration: appointment.duration,
    id: appointment.id,
    meetingRoomId: appointment.meeting_room_id,
    patientAvatarUrl: patientMap.get(appointment.patient_id)?.avatarUrl ?? null,
    patientId: patientMap.get(appointment.patient_id)?.patientId ?? "Unknown",
    patientName: patientMap.get(appointment.patient_id)?.patientName ?? "Patient",
    reason: appointment.reason,
    scheduledAt: appointment.scheduled_at,
    status: appointment.status,
    type: appointment.type,
  }))
}

export async function getAppointmentDetail(appointmentId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("appointments")
    .select(
      "booked_by, id, cancel_reason, duration, meeting_room_id, patient_id, provider_id, reason, scheduled_at, status, type"
    )
    .eq("id", appointmentId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  const patient = await getPatientDetail(data.patient_id)

  if (!patient) {
    return null
  }

  const relatedNote = patient.notes.find((note) =>
    isBefore(new Date(note.createdAt), new Date(data.scheduled_at))
  )

  return {
    appointment: {
      bookedBy: data.booked_by,
      cancelReason: data.cancel_reason,
      duration: data.duration,
      id: data.id,
      meetingRoomId: data.meeting_room_id,
      reason: data.reason,
      scheduledAt: data.scheduled_at,
      status: data.status,
      type: data.type,
    },
    patient,
    relatedNote: relatedNote ?? null,
  }
}
