import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

type NoteRow = Pick<
  Tables<"clinical_notes">,
  "assessment" | "created_at" | "diagnosis_codes" | "id" | "signed_at" | "status"
>
type AppointmentRow = Pick<
  Tables<"appointments">,
  "id" | "reason" | "scheduled_at" | "status" | "type" | "provider_id"
>
type LabOrderRow = Pick<
  Tables<"lab_orders">,
  "id" | "ordered_at" | "status" | "test_name"
>
type LabResultRow = Pick<
  Tables<"lab_results">,
  "is_abnormal" | "lab_order_id" | "reported_at" | "result_summary"
>
type ProviderRow = Pick<Tables<"providers">, "id" | "profile_id">
type ProfileRow = Pick<Tables<"profiles">, "full_name" | "id">

export type EHRTimelineItem = {
  badge: string
  date: string
  description: string
  href: string
  id: string
  status: string | null
  title: string
  type: "note" | "appointment" | "record" | "lab"
}

async function getProviderNames(providerIds: string[]) {
  const supabase = await createClient()

  if (providerIds.length === 0) {
    return new Map<string, string>()
  }

  const { data: providers, error } = await supabase
    .from("providers")
    .select("id, profile_id")
    .in("id", providerIds)

  if (error) {
    throw new Error(error.message)
  }

  const providerRows = (providers ?? []) as ProviderRow[]
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      providerRows.map((provider) => provider.profile_id)
    )

  if (profileError) {
    throw new Error(profileError.message)
  }

  const profileMap = new Map((profiles ?? []).map((profile: ProfileRow) => [profile.id, profile.full_name]))

  return new Map(
    providerRows.map((provider) => [provider.id, profileMap.get(provider.profile_id) ?? "Provider"])
  )
}

export async function getPatientTimeline(patientId: string): Promise<EHRTimelineItem[]> {
  const supabase = await createClient()
  const [notesResult, appointmentsResult, labOrdersResult] = await Promise.all([
    supabase
      .from("clinical_notes")
      .select("assessment, created_at, diagnosis_codes, id, signed_at, status")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, provider_id, reason, scheduled_at, status, type")
      .eq("patient_id", patientId)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("lab_orders")
      .select("id, ordered_at, status, test_name")
      .eq("patient_id", patientId)
      .order("ordered_at", { ascending: false }),
  ])

  if (notesResult.error) {
    throw new Error(notesResult.error.message)
  }

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message)
  }

  if (labOrdersResult.error) {
    throw new Error(labOrdersResult.error.message)
  }

  const notes = (notesResult.data ?? []) as NoteRow[]
  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[]
  const labOrders = (labOrdersResult.data ?? []) as LabOrderRow[]
  const providerNames = await getProviderNames(
    [...new Set(appointments.map((appointment) => appointment.provider_id))]
  )
  let labResultMap = new Map<string, LabResultRow>()

  if (labOrders.length > 0) {
    const { data: labResults, error: labResultsError } = await supabase
      .from("lab_results")
      .select("is_abnormal, lab_order_id, reported_at, result_summary")
      .in(
        "lab_order_id",
        labOrders.map((order) => order.id)
      )

    if (labResultsError) {
      throw new Error(labResultsError.message)
    }

    labResultMap = new Map(
      ((labResults ?? []) as LabResultRow[]).map((result) => [result.lab_order_id, result])
    )
  }

  const timeline: EHRTimelineItem[] = [
    ...notes.map((note) => ({
      badge: "SOAP Note",
      date: note.created_at,
      description: note.assessment ?? "Clinical assessment captured for this visit.",
      href: `/notes/${note.id}`,
      id: `note-${note.id}`,
      status: note.status,
      title:
        note.diagnosis_codes && note.diagnosis_codes.length > 0
          ? note.diagnosis_codes.join(", ")
          : "Clinical note entry",
      type: "note" as const,
    })),
    ...appointments.map((appointment) => ({
      badge: appointment.type.replace("_", " "),
      date: appointment.scheduled_at,
      description: `${providerNames.get(appointment.provider_id) ?? "Provider"}${
        appointment.reason ? ` - ${appointment.reason}` : ""
      }`,
      href: `/appointments/${appointment.id}`,
      id: `appointment-${appointment.id}`,
      status: appointment.status,
      title: "Appointment",
      type: "appointment" as const,
    })),
    ...notes
      .filter((note) => note.status === "signed" && note.signed_at)
      .map((note) => ({
        badge: "Clinical Record",
        date: note.signed_at ?? note.created_at,
        description:
          note.assessment ?? "Signed clinical record available for patient review.",
        href: `/notes/${note.id}`,
        id: `record-${note.id}`,
        status: note.status,
        title:
          note.diagnosis_codes && note.diagnosis_codes.length > 0
            ? `Record: ${note.diagnosis_codes.join(", ")}`
            : "Signed clinical record",
        type: "record" as const,
      })),
    ...labOrders.map((order) => {
      const result = labResultMap.get(order.id)

      return {
        badge: "Lab Order",
        date: result?.reported_at ?? order.ordered_at,
        description: result?.result_summary
          ? `${order.status.replace("_", " ")} - ${result.result_summary}${
              result.is_abnormal ? " Abnormal result flagged." : ""
            }`
          : `Lab order ${order.status.replace("_", " ")}.`,
        href: `/labs/${order.id}`,
        id: `lab-${order.id}`,
        status: order.status,
        title: order.test_name,
        type: "lab" as const,
      }
    }),
  ]

  return timeline.sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
  )
}
