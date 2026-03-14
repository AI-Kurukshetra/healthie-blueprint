import "server-only"

import { endOfDay, isSameDay, startOfDay } from "date-fns"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type Role = "provider" | "patient"

export type ShellNotification = Pick<
  Tables<"notifications">,
  "id" | "title" | "message" | "link" | "type" | "is_read" | "created_at"
>

export type ShellProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "avatar_url" | "role"
>

export type ShellData = {
  notifications: ShellNotification[]
  patient: Pick<Tables<"patients">, "id" | "patient_id"> | null
  profile: ShellProfile
  provider: Pick<Tables<"providers">, "id" | "specialty"> | null
  unreadNotificationCount: number
  userId: string
}

export type DashboardAppointment = {
  id: string
  meetingRoomId: string | null
  patientId: string
  patientName: string
  reason: string | null
  scheduledAt: string
  status: string
  type: string
}

export type ProviderDashboardData = {
  abnormalLabsCount: number
  pendingNotesCount: number
  pendingLabsCount: number
  todaysAppointmentsCount: number
  todaysQueue: DashboardAppointment[]
  totalPatients: number
  unreadMessagesCount: number
  upcomingAppointments: DashboardAppointment[]
}

export type NextAppointment = {
  bookedBy: string
  id: string
  providerName: string
  reason: string | null
  scheduledAt: string
  status: string
  type: string
}

export type PatientPortalOverview = {
  nextAppointment: NextAppointment | null
  signedNotesCount: number
  unreadMessagesCount: number
  upcomingAppointmentsCount: number
}

export type PortalAppointment = {
  bookedBy: string
  duration: number
  id: string
  meetingRoomId: string | null
  providerName: string
  providerSpecialty: string
  reason: string | null
  scheduledAt: string
  status: string
  type: string
}

export type PatientBookableProvider = {
  availableDays: string[]
  fullName: string
  id: string
  slotDuration: number
  specialty: string
}

export type PortalRecord = {
  diagnosisCodes: string[]
  id: string
  providerName: string
  signedAt: string | null
  status: string
}

export type PortalMessage = {
  content: string
  createdAt: string
  id: string
  isRead: boolean
  senderLabel: string
}

type AppointmentRow = Pick<
  Tables<"appointments">,
  | "booked_by"
  | "duration"
  | "id"
  | "meeting_room_id"
  | "patient_id"
  | "provider_id"
  | "reason"
  | "scheduled_at"
  | "status"
  | "type"
>

type ProviderLookupRow = Pick<Tables<"providers">, "id" | "profile_id" | "specialty">
type ProviderBookingRow = Pick<
  Tables<"providers">,
  "available_days" | "id" | "profile_id" | "slot_duration" | "specialty"
>
type ProfileLookupRow = Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url">

async function getProfileLookups(profileIds: string[]) {
  const supabase = await createClient()

  if (profileIds.length === 0) {
    return new Map<string, ProfileLookupRow>()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", profileIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

async function getPatientNames(patientIds: string[]) {
  const supabase = await createClient()

  if (patientIds.length === 0) {
    return new Map<string, { patientId: string; fullName: string }>()
  }

  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_id, profile_id")
    .in("id", patientIds)

  if (error) {
    throw new Error(error.message)
  }

  const patients = data ?? []
  const profiles = await getProfileLookups(patients.map((patient) => patient.profile_id))

  return new Map(
    patients.map((patient) => [
      patient.id,
      {
        patientId: patient.patient_id,
        fullName: profiles.get(patient.profile_id)?.full_name ?? "Patient",
      },
    ])
  )
}

async function getProviderNames(providerIds: string[]) {
  const admin = createAdminClient()

  if (providerIds.length === 0) {
    return new Map<string, { fullName: string; specialty: string }>()
  }

  const { data, error } = await admin
    .from("providers")
    .select("id, profile_id, specialty")
    .in("id", providerIds)

  if (error) {
    throw new Error(error.message)
  }

  const providers = (data ?? []) as ProviderLookupRow[]
  const { data: profileData, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", providers.map((provider) => provider.profile_id))

  if (profileError) {
    throw new Error(profileError.message)
  }

  const profiles = new Map(
    (profileData ?? []).map((profile) => [profile.id, profile])
  )

  return new Map(
    providers.map((provider) => [
      provider.id,
      {
        fullName: profiles.get(provider.profile_id)?.full_name ?? "Provider",
        specialty: provider.specialty,
      },
    ])
  )
}

function enrichAppointments(
  appointments: AppointmentRow[],
  patientNames: Map<string, { patientId: string; fullName: string }>
) {
  return appointments.map((appointment) => ({
    id: appointment.id,
    meetingRoomId: appointment.meeting_room_id,
    patientId: patientNames.get(appointment.patient_id)?.patientId ?? "Unknown",
    patientName: patientNames.get(appointment.patient_id)?.fullName ?? "Patient",
    reason: appointment.reason,
    scheduledAt: appointment.scheduled_at,
    status: appointment.status,
    type: appointment.type,
  }))
}

export async function getShellData(expectedRole: Role): Promise<ShellData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect("/login")
  }

  if (expectedRole === "provider" && profile.role === "patient") {
    redirect("/portal")
  }

  if (expectedRole === "patient" && profile.role !== "patient") {
    redirect("/dashboard")
  }

  const unreadNotificationsPromise = supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  const notificationsPromise = supabase
    .from("notifications")
    .select("id, title, message, link, type, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const providerPromise =
    expectedRole === "provider"
      ? supabase
          .from("providers")
          .select("id, specialty")
          .eq("profile_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null })

  const patientPromise =
    expectedRole === "patient"
      ? supabase
          .from("patients")
          .select("id, patient_id")
          .eq("profile_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null })

  const [
    unreadNotificationsResult,
    notificationsResult,
    providerResult,
    patientResult,
  ] = await Promise.all([
    unreadNotificationsPromise,
    notificationsPromise,
    providerPromise,
    patientPromise,
  ])

  if (notificationsResult.error) {
    throw new Error(notificationsResult.error.message)
  }

  if (providerResult.error) {
    throw new Error(providerResult.error.message)
  }

  if (patientResult.error) {
    throw new Error(patientResult.error.message)
  }

  return {
    notifications: notificationsResult.data ?? [],
    patient: patientResult.data,
    profile,
    provider: providerResult.data,
    unreadNotificationCount: unreadNotificationsResult.count ?? 0,
    userId: user.id,
  }
}

export async function getProviderDashboardData(
  providerId: string,
  userId: string
): Promise<ProviderDashboardData> {
  const supabase = await createClient()
  const todayStart = startOfDay(new Date()).toISOString()
  const todayEnd = endOfDay(new Date()).toISOString()

  const totalPatientsPromise = supabase
    .from("patients")
    .select("*", { count: "exact", head: true })

  const appointmentsPromise = supabase
    .from("appointments")
    .select("id, meeting_room_id, patient_id, provider_id, reason, scheduled_at, status, type")
    .eq("provider_id", providerId)
    .gte("scheduled_at", todayStart)
    .order("scheduled_at", { ascending: true })
    .limit(12)

  const todaysAppointmentsCountPromise = supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .gte("scheduled_at", todayStart)
    .lte("scheduled_at", todayEnd)

  const pendingNotesPromise = supabase
    .from("clinical_notes")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("status", "draft")

  const unreadMessagesPromise = supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("is_read", false)

  const pendingLabsPromise = supabase
    .from("lab_orders")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .in("status", ["ordered", "sample_collected", "processing"])

  const abnormalLabsPromise = supabase
    .from("lab_results")
    .select("*", { count: "exact", head: true })
    .eq("provider_id", providerId)
    .eq("is_abnormal", true)

  const [
    totalPatientsResult,
    appointmentsResult,
    todaysAppointmentsResult,
    pendingNotesResult,
    unreadMessagesResult,
    pendingLabsResult,
    abnormalLabsResult,
  ] = await Promise.all([
    totalPatientsPromise,
    appointmentsPromise,
    todaysAppointmentsCountPromise,
    pendingNotesPromise,
    unreadMessagesPromise,
    pendingLabsPromise,
    abnormalLabsPromise,
  ])

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message)
  }

  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[]
  const patientNames = await getPatientNames(
    [...new Set(appointments.map((appointment) => appointment.patient_id))]
  )
  const enrichedAppointments = enrichAppointments(appointments, patientNames)
  const todaysQueue = enrichedAppointments.filter((appointment) =>
    isSameDay(new Date(appointment.scheduledAt), new Date())
  )
  const upcomingAppointments = enrichedAppointments.filter(
    (appointment) => !isSameDay(new Date(appointment.scheduledAt), new Date())
  )

  return {
    abnormalLabsCount: abnormalLabsResult.count ?? 0,
    pendingNotesCount: pendingNotesResult.count ?? 0,
    pendingLabsCount: pendingLabsResult.count ?? 0,
    todaysAppointmentsCount: todaysAppointmentsResult.count ?? 0,
    todaysQueue,
    totalPatients: totalPatientsResult.count ?? 0,
    unreadMessagesCount: unreadMessagesResult.count ?? 0,
    upcomingAppointments,
  }
}

export async function getPatientPortalOverview(
  patientId: string,
  userId: string
): Promise<PatientPortalOverview> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const nextAppointmentPromise = supabase
    .from("appointments")
    .select("booked_by, id, provider_id, reason, scheduled_at, status, type")
    .eq("patient_id", patientId)
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  const upcomingAppointmentsCountPromise = supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .gte("scheduled_at", now)

  const signedNotesCountPromise = supabase
    .from("clinical_notes")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .eq("status", "signed")

  const unreadMessagesCountPromise = supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("is_read", false)

  const [
    nextAppointmentResult,
    upcomingAppointmentsCountResult,
    signedNotesCountResult,
    unreadMessagesCountResult,
  ] = await Promise.all([
    nextAppointmentPromise,
    upcomingAppointmentsCountPromise,
    signedNotesCountPromise,
    unreadMessagesCountPromise,
  ])

  if (nextAppointmentResult.error) {
    throw new Error(nextAppointmentResult.error.message)
  }

  const nextAppointment = nextAppointmentResult.data
  const providerNames = await getProviderNames(
    nextAppointment ? [nextAppointment.provider_id] : []
  )

  return {
    nextAppointment: nextAppointment
      ? {
          id: nextAppointment.id,
          bookedBy: nextAppointment.booked_by,
          providerName:
            providerNames.get(nextAppointment.provider_id)?.fullName ?? "Provider",
          reason: nextAppointment.reason,
          scheduledAt: nextAppointment.scheduled_at,
          status: nextAppointment.status,
          type: nextAppointment.type,
        }
      : null,
    signedNotesCount: signedNotesCountResult.count ?? 0,
    unreadMessagesCount: unreadMessagesCountResult.count ?? 0,
    upcomingAppointmentsCount: upcomingAppointmentsCountResult.count ?? 0,
  }
}

export async function getPatientAppointments(patientId: string): Promise<PortalAppointment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("appointments")
    .select("booked_by, duration, id, meeting_room_id, provider_id, reason, scheduled_at, status, type")
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true })
    .limit(20)

  if (error) {
    throw new Error(error.message)
  }

  const appointments = data ?? []
  const providers = await getProviderNames(
    [...new Set(appointments.map((appointment) => appointment.provider_id))]
  )

  return appointments.map((appointment) => ({
    bookedBy: appointment.booked_by,
    duration: appointment.duration,
    id: appointment.id,
    meetingRoomId: appointment.meeting_room_id,
    providerName: providers.get(appointment.provider_id)?.fullName ?? "Provider",
    providerSpecialty:
      providers.get(appointment.provider_id)?.specialty ?? "General Practice",
    reason: appointment.reason,
    scheduledAt: appointment.scheduled_at,
    status: appointment.status,
    type: appointment.type,
  }))
}

export async function getPatientBookableProviders(): Promise<PatientBookableProvider[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("providers")
    .select("available_days, id, profile_id, slot_duration, specialty")
    .order("specialty", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const providers = (data ?? []) as ProviderBookingRow[]
  const { data: profileData, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", providers.map((provider) => provider.profile_id))

  if (profileError) {
    throw new Error(profileError.message)
  }

  const profiles = new Map(
    (profileData ?? []).map((profile) => [profile.id, profile])
  )

  return providers.map((provider) => ({
    availableDays: provider.available_days ?? [],
    fullName: profiles.get(provider.profile_id)?.full_name ?? "Provider",
    id: provider.id,
    slotDuration: provider.slot_duration ?? 30,
    specialty: provider.specialty,
  }))
}

export async function getPatientRecords(patientId: string): Promise<PortalRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clinical_notes")
    .select("id, diagnosis_codes, provider_id, signed_at, status")
    .eq("patient_id", patientId)
    .eq("status", "signed")
    .order("signed_at", { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(error.message)
  }

  const notes = data ?? []
  const providers = await getProviderNames(
    [...new Set(notes.map((note) => note.provider_id))]
  )

  return notes.map((note) => ({
    diagnosisCodes: note.diagnosis_codes ?? [],
    id: note.id,
    providerName: providers.get(note.provider_id)?.fullName ?? "Provider",
    signedAt: note.signed_at,
    status: note.status,
  }))
}

export async function getPatientMessages(
  patientId: string,
  userId: string
): Promise<PortalMessage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("id, content, created_at, is_read, sender_id, receiver_id")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(error.message)
  }

  const messages = data ?? []
  const participantIds = [
    ...new Set(
      messages.flatMap((message) => [message.sender_id, message.receiver_id])
    ),
  ]
  const profiles = await getProfileLookups(participantIds)

  return messages.map((message) => {
    const counterpartId =
      message.sender_id === userId ? message.receiver_id : message.sender_id
    const counterpartName = profiles.get(counterpartId)?.full_name ?? "Care team"
    const senderLabel =
      message.sender_id === userId ? `You to ${counterpartName}` : counterpartName

    return {
      content: message.content,
      createdAt: message.created_at,
      id: message.id,
      isRead: message.is_read,
      senderLabel,
    }
  })
}
