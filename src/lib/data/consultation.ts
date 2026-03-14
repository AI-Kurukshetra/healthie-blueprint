import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type ProfileRow = Pick<Tables<"profiles">, "full_name" | "id" | "role">

export type ConsultationSession = {
  appointment: {
    id: string
    reason: string | null
    scheduledAt: string
    status: string
    type: string
  }
  patient: {
    id: string
    patientCode: string
    patientName: string
  }
  provider: {
    id: string
    providerName: string
    specialty: string
  }
  roomId: string
  userRole: string
}

async function getProfileById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as ProfileRow
}

export async function getConsultationSession(roomId: string): Promise<ConsultationSession | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, meeting_room_id, patient_id, provider_id, reason, scheduled_at, status, type")
    .eq("meeting_room_id", roomId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!appointment) {
    return null
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id, patient_id, profile_id")
    .eq("id", appointment.patient_id)
    .single()

  if (patientError) {
    throw new Error(patientError.message)
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, profile_id, specialty")
    .eq("id", appointment.provider_id)
    .single()

  if (providerError) {
    throw new Error(providerError.message)
  }

  const [patientProfile, providerProfile, currentProfile] = await Promise.all([
    getProfileById(patient.profile_id),
    getProfileById(provider.profile_id),
    getProfileById(user.id),
  ])

  return {
    appointment: {
      id: appointment.id,
      reason: appointment.reason,
      scheduledAt: appointment.scheduled_at,
      status: appointment.status,
      type: appointment.type,
    },
    patient: {
      id: patient.id,
      patientCode: patient.patient_id,
      patientName: patientProfile.full_name,
    },
    provider: {
      id: provider.id,
      providerName: providerProfile.full_name,
      specialty: provider.specialty,
    },
    roomId,
    userRole: currentProfile.role,
  }
}
