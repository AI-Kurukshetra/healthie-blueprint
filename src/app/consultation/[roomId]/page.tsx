import Link from "next/link"
import { redirect } from "next/navigation"

import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import {
  ConsultationExperience,
  type ConsultationExperienceSession,
} from "@/components/video/ConsultationExperience"
import { getConsultationSession } from "@/lib/data/consultation"
import { createClient } from "@/lib/supabase/server"

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, patient_id, provider_id, reason, status")
    .eq("meeting_room_id", roomId)
    .maybeSingle()

  if (error || !appointment) {
    redirect("/dashboard")
  }

  const [{ data: patient, error: patientError }, { data: provider, error: providerError }] =
    await Promise.all([
      supabase
        .from("patients")
        .select("profile_id")
        .eq("id", appointment.patient_id)
        .maybeSingle(),
      supabase
        .from("providers")
        .select("profile_id")
        .eq("id", appointment.provider_id)
        .maybeSingle(),
    ])

  if (patientError || providerError || !patient || !provider) {
    redirect("/dashboard")
  }

  const isParticipant =
    patient.profile_id === user.id || provider.profile_id === user.id

  if (!isParticipant) {
    redirect("/dashboard")
  }

  if (appointment.status === "cancelled") {
    const backHref =
      patient.profile_id === user.id ? "/portal/appointments" : `/appointments/${appointment.id}`

    return (
      <EmptyState
        action={
          <Link href={backHref}>
            <Button variant="outline">Back</Button>
          </Link>
        }
        description={appointment.reason ?? "This consultation cannot be joined anymore."}
        title="This consultation has been cancelled"
      />
    )
  }

  const session = await getConsultationSession(roomId)

  if (!session) {
    redirect("/dashboard")
  }

  const backHref =
    session.userRole === "patient"
      ? "/portal/appointments"
      : `/appointments/${session.appointment.id}`

  return (
    <ConsultationExperience
      backHref={backHref}
      session={session as ConsultationExperienceSession}
    />
  )
}
