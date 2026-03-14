import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type CareTeamRow = Pick<Tables<"care_team">, "added_at" | "id" | "patient_id" | "provider_id" | "role">
type ProviderRow = Pick<
  Tables<"providers">,
  "id" | "license_number" | "license_state" | "profile_id" | "specialty"
>
type ProfileRow = Pick<Tables<"profiles">, "avatar_url" | "email" | "full_name" | "id">

export type CareTeamMember = {
  addedAt: string
  avatarUrl: string | null
  email: string
  fullName: string
  id: string
  licenseNumber: string
  licenseState: string
  providerId: string
  role: string
  specialty: string
}

export type CareTeamProviderOption = {
  email: string
  fullName: string
  licenseNumber: string
  providerId: string
  specialty: string
}

async function getProviderProfiles(providerRows: ProviderRow[]) {
  const supabase = await createClient()

  if (providerRows.length === 0) {
    return new Map<string, ProfileRow>()
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url, email, full_name")
    .in(
      "id",
      providerRows.map((provider) => provider.profile_id)
    )

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((profile) => [profile.id, profile]))
}

export async function getCareTeam(patientId: string): Promise<CareTeamMember[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("care_team")
    .select("id, added_at, patient_id, provider_id, role")
    .eq("patient_id", patientId)
    .order("added_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const careTeamRows = (data ?? []) as CareTeamRow[]

  if (careTeamRows.length === 0) {
    return []
  }

  const { data: providers, error: providerError } = await supabase
    .from("providers")
    .select("id, license_number, license_state, profile_id, specialty")
    .in(
      "id",
      careTeamRows.map((member) => member.provider_id)
    )

  if (providerError) {
    throw new Error(providerError.message)
  }

  const providerRows = (providers ?? []) as ProviderRow[]
  const profiles = await getProviderProfiles(providerRows)
  const providerMap = new Map(providerRows.map((provider) => [provider.id, provider]))

  return careTeamRows.map((member) => {
    const provider = providerMap.get(member.provider_id)
    const profile = provider ? profiles.get(provider.profile_id) : undefined

    return {
      addedAt: member.added_at,
      avatarUrl: profile?.avatar_url ?? null,
      email: profile?.email ?? "",
      fullName: profile?.full_name ?? "Provider",
      id: member.id,
      licenseNumber: provider?.license_number ?? "",
      licenseState: provider?.license_state ?? "",
      providerId: member.provider_id,
      role: member.role,
      specialty: provider?.specialty ?? "",
    }
  })
}

export async function getCareTeamProviderOptions(): Promise<CareTeamProviderOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("providers")
    .select("id, license_number, license_state, profile_id, specialty")
    .order("specialty", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const providerRows = (data ?? []) as ProviderRow[]
  const profiles = await getProviderProfiles(providerRows)

  return providerRows
    .map((provider) => {
      const profile = profiles.get(provider.profile_id)

      return {
        email: profile?.email ?? "",
        fullName: profile?.full_name ?? "Provider",
        licenseNumber: `${provider.license_state}-${provider.license_number}`,
        providerId: provider.id,
        specialty: provider.specialty,
      }
    })
    .sort((left, right) => left.fullName.localeCompare(right.fullName))
}
