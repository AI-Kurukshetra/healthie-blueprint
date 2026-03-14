import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type MessageRow = Pick<
  Tables<"messages">,
  "content" | "created_at" | "id" | "is_read" | "patient_id" | "receiver_id" | "sender_id"
>

type ProfileRow = Pick<Tables<"profiles">, "avatar_url" | "full_name" | "id" | "role">
type PatientRow = Pick<
  Tables<"patients">,
  "id" | "patient_id" | "primary_provider_id" | "profile_id"
>
type ProviderRow = Pick<Tables<"providers">, "id" | "profile_id">

export type MessagingParticipant = {
  avatarUrl: string | null
  fullName: string
  id: string
  patientCode: string | null
  patientRecordId: string | null
  role: string
}

export type MessagingMessage = {
  content: string
  createdAt: string
  id: string
  isRead: boolean
  patientId: string | null
  receiverId: string
  senderId: string
}

export type MessagingData = {
  messages: MessagingMessage[]
  participants: MessagingParticipant[]
}

async function getProfilesByIds(profileIds: string[]) {
  const supabase = await createClient()

  if (profileIds.length === 0) {
    return new Map<string, ProfileRow>()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url, full_name, role")
    .in("id", profileIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

async function getPatientsByProfileIds(profileIds: string[]) {
  const supabase = await createClient()

  if (profileIds.length === 0) {
    return new Map<string, PatientRow>()
  }

  const { data, error } = await supabase
    .from("patients")
    .select("id, patient_id, primary_provider_id, profile_id")
    .in("profile_id", profileIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((patient) => [patient.profile_id, patient]))
}

async function getProvidersByIds(providerIds: string[]) {
  const supabase = await createClient()

  if (providerIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from("providers")
    .select("id, profile_id")
    .in("id", providerIds)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ProviderRow[]
}

async function getProfileRole(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.role
}

function buildPatientParticipant(patient: PatientRow, profile: ProfileRow | undefined) {
  return {
    avatarUrl: profile?.avatar_url ?? null,
    fullName: profile?.full_name ?? "Patient",
    id: patient.profile_id,
    patientCode: patient.patient_id,
    patientRecordId: patient.id,
    role: profile?.role ?? "patient",
  } satisfies MessagingParticipant
}

function buildProviderParticipant(
  provider: ProviderRow,
  profile: ProfileRow | undefined,
  patientRecordId: string | null
) {
  return {
    avatarUrl: profile?.avatar_url ?? null,
    fullName: profile?.full_name ?? "Care team",
    id: provider.profile_id,
    patientCode: null,
    patientRecordId,
    role: profile?.role ?? "provider",
  } satisfies MessagingParticipant
}

function mergeParticipants(...groups: MessagingParticipant[][]) {
  const merged = new Map<string, MessagingParticipant>()

  groups.flat().forEach((participant) => {
    const previous = merged.get(participant.id)

    if (!previous) {
      merged.set(participant.id, participant)
      return
    }

    merged.set(participant.id, {
      ...previous,
      ...participant,
      avatarUrl: participant.avatarUrl ?? previous.avatarUrl,
      fullName: participant.fullName || previous.fullName,
      patientCode: participant.patientCode ?? previous.patientCode,
      patientRecordId: participant.patientRecordId ?? previous.patientRecordId,
      role: participant.role || previous.role,
    })
  })

  return [...merged.values()]
}

async function getProviderCareParticipants(userId: string) {
  const supabase = await createClient()
  const { data: provider, error } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!provider) {
    return []
  }

  const { data: patients, error: patientError } = await supabase
    .from("patients")
    .select("id, patient_id, primary_provider_id, profile_id")
    .eq("primary_provider_id", provider.id)

  if (patientError) {
    throw new Error(patientError.message)
  }

  const patientRows = (patients ?? []) as PatientRow[]
  const profiles = await getProfilesByIds(patientRows.map((patient) => patient.profile_id))

  return patientRows.map((patient) =>
    buildPatientParticipant(patient, profiles.get(patient.profile_id))
  )
}

async function getPatientCareParticipants(userId: string) {
  const supabase = await createClient()
  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, patient_id, primary_provider_id, profile_id")
    .eq("profile_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!patient) {
    return []
  }

  const { data: appointments, error: appointmentError } = await supabase
    .from("appointments")
    .select("provider_id")
    .eq("patient_id", patient.id)

  if (appointmentError) {
    throw new Error(appointmentError.message)
  }

  const providerIds = [
    ...new Set(
      [patient.primary_provider_id, ...(appointments ?? []).map((appointment) => appointment.provider_id)]
        .filter((providerId): providerId is string => Boolean(providerId))
    ),
  ]
  const providers = await getProvidersByIds(providerIds)
  const profiles = await getProfilesByIds(providers.map((provider) => provider.profile_id))

  return providers.map((provider) =>
    buildProviderParticipant(provider, profiles.get(provider.profile_id), patient.id)
  )
}

async function getMessageParticipants(userId: string, messages: MessageRow[]) {
  const participantIds = [
    ...new Set(
      messages
        .flatMap((message) => [message.sender_id, message.receiver_id])
        .filter((participantId) => participantId !== userId)
    ),
  ]
  const profiles = await getProfilesByIds(participantIds)
  const patients = await getPatientsByProfileIds(participantIds)

  return participantIds.map((participantId) => {
    const patient = patients.get(participantId)

    return {
      avatarUrl: profiles.get(participantId)?.avatar_url ?? null,
      fullName: profiles.get(participantId)?.full_name ?? "Care team",
      id: participantId,
      patientCode: patient?.patient_id ?? null,
      patientRecordId: patient?.id ?? null,
      role: profiles.get(participantId)?.role ?? "user",
    } satisfies MessagingParticipant
  })
}

export async function getMessagingData(userId: string): Promise<MessagingData> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("messages")
    .select("content, created_at, id, is_read, patient_id, receiver_id, sender_id")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const role = await getProfileRole(userId)
  const messages = (data ?? []) as MessageRow[]
  const [messageParticipants, careParticipants] = await Promise.all([
    getMessageParticipants(userId, messages),
    role === "patient"
      ? getPatientCareParticipants(userId)
      : getProviderCareParticipants(userId),
  ])

  return {
    messages: messages.map((message) => ({
      content: message.content,
      createdAt: message.created_at,
      id: message.id,
      isRead: message.is_read,
      patientId: message.patient_id,
      receiverId: message.receiver_id,
      senderId: message.sender_id,
    })),
    participants: mergeParticipants(careParticipants, messageParticipants),
  }
}
