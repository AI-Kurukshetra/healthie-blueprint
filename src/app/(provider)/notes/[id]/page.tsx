import { notFound } from "next/navigation"

import { NoteForm } from "@/components/notes/NoteForm"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getNoteDetail, getNotePatients, getOpenAppointmentsForNotes } from "@/lib/data/notes"
import { getProviderProfile } from "@/lib/data/provider"
import { createClient } from "@/lib/supabase/server"
import { formatDateTime, getInitials } from "@/lib/utils"

export default async function NoteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ appointment?: string; patient?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const provider = await getProviderProfile(user.id)

  if (!provider) {
    return null
  }

  const [patientOptions, appointmentOptions] = await Promise.all([
    getNotePatients(),
    getOpenAppointmentsForNotes(provider.id),
  ])

  if (id === "new") {
    const linkedAppointment = query.appointment
      ? appointmentOptions.find((appointment) => appointment.id === query.appointment)
      : null
    const selectedPatientId = query.patient || linkedAppointment?.patientId || ""

    return (
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">New SOAP Note</h2>
          <p className="mt-2 text-sm text-slate-600">
            Capture the consultation details and either save a draft or sign the note.
          </p>
        </section>

        <NoteForm
          appointmentOptions={appointmentOptions}
          initialValues={{
            appointment_id: query.appointment ?? "",
            assessment: "",
            bp_diastolic: "",
            bp_systolic: "",
            diagnosis_codes: [],
            heart_rate: "",
            height: "",
            objective: "",
            oxygen_sat: "",
            patient_id: selectedPatientId,
            plan: "",
            subjective: "",
            temperature: "",
            weight: "",
          }}
          patientOptions={patientOptions}
          readOnly={false}
        />
      </div>
    )
  }

  const note = await getNoteDetail(id)

  if (!note) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar size="lg">
              <AvatarImage alt={note.patient.patientName} src={note.patient.avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(note.patient.patientName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-950">
                  {note.patient.patientName}
                </h2>
                <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  {note.patient.patientId}
                </Badge>
                <StatusBadge value={note.status} />
              </div>
              <p className="text-sm text-slate-600">
                Created {formatDateTime(note.createdAt)}
              </p>
              {note.appointment ? (
                <p className="text-sm text-slate-500">
                  Linked appointment: {formatDateTime(note.appointment.scheduled_at)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {patientOptions.length === 0 ? (
        <EmptyState
          description="A patient record is required before notes can be created or edited."
          title="No patients available"
        />
      ) : (
        <NoteForm
          appointmentOptions={appointmentOptions}
          initialValues={note.formValues}
          noteId={note.id}
          patientOptions={patientOptions}
          readOnly={note.status === "signed"}
          signedAt={note.signedAt}
        />
      )}
    </div>
  )
}
