import Link from "next/link"
import { notFound } from "next/navigation"

import { CancelAppointmentButton } from "@/components/appointments/CancelAppointmentButton"
import { ProviderPendingRequestActions } from "@/components/appointments/ProviderPendingRequestActions"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAppointmentDetail } from "@/lib/data/provider"
import {
  formatDateTime,
  getAppointmentStatusPresentation,
  getInitials,
} from "@/lib/utils"

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await getAppointmentDetail(id)

  if (!detail) {
    notFound()
  }

  const { appointment, patient, relatedNote } = detail
  const appointmentStatus = getAppointmentStatusPresentation(
    appointment.status,
    appointment.bookedBy
  )
  const canJoinConsultation =
    Boolean(appointment.meetingRoomId) &&
    (appointment.status === "confirmed" || appointment.status === "in_progress")
  const isPatientRequestAwaitingResponse =
    appointment.status === "scheduled" && appointment.bookedBy === "patient"
  const canCancel =
    appointment.status !== "cancelled" &&
    appointment.status !== "completed" &&
    appointment.status !== "in_progress" &&
    appointment.status !== "scheduled"

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-slate-950">Appointment Details</h2>
              <StatusBadge
                label={appointmentStatus.label}
                tone={appointmentStatus.tone}
                value={appointment.status}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {formatDateTime(appointment.scheduledAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/patients/${patient.id}`}>
              <Button variant="outline">Open Patient</Button>
            </Link>
            {canJoinConsultation ? (
              <Link href={`/consultation/${appointment.meetingRoomId}`}>
                <Button>Join Call</Button>
              </Link>
            ) : null}
            <Link
              href={
                relatedNote
                  ? `/notes/${relatedNote.id}`
                  : `/notes/new?patient=${patient.id}&appointment=${appointment.id}`
              }
            >
              <Button variant="outline">
                {relatedNote ? "View Note" : "Add Note"}
              </Button>
            </Link>
            {isPatientRequestAwaitingResponse ? (
              <ProviderPendingRequestActions appointmentId={appointment.id} />
            ) : null}
            {canCancel ? (
              <CancelAppointmentButton appointmentId={appointment.id} />
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <Avatar size="lg">
              <AvatarImage alt={patient.fullName} src={patient.avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-slate-950">{patient.fullName}</h3>
                <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  {patient.patientId}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{patient.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Appointment Type</p>
              <p className="mt-2 text-sm text-slate-600">
                {appointment.type.replace("_", " ")}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Duration</p>
              <p className="mt-2 text-sm text-slate-600">{appointment.duration} minutes</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Booking source</p>
              <p className="mt-2 text-sm text-slate-600">
                {appointment.bookedBy === "patient" ? "Requested by patient" : "Scheduled by provider"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm font-medium text-slate-900">Reason</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {appointment.reason || "Consultation"}
              </p>
            </div>
            {appointment.cancelReason ? (
              <div className="rounded-2xl bg-rose-50 p-4 md:col-span-2">
                <p className="text-sm font-medium text-rose-700">Cancellation reason</p>
                <p className="mt-2 text-sm leading-6 text-rose-600">
                  {appointment.cancelReason}
                </p>
              </div>
            ) : null}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Latest Clinical Note</h3>
            {relatedNote ? (
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>Created: {formatDateTime(relatedNote.createdAt)}</p>
                <p>
                  Diagnosis:{" "}
                  {relatedNote.diagnosisCodes.length > 0
                    ? relatedNote.diagnosisCodes.join(", ")
                    : "No diagnosis code"}
                </p>
                <StatusBadge value={relatedNote.status} />
              </div>
            ) : (
              <EmptyState
                description="Clinical notes linked to this patient will appear here."
                title="No note available"
              />
            )}
          </article>

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Portal Snapshot</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Phone: {patient.phone ?? "--"}</p>
              <p>Blood group: {patient.bloodGroup ?? "--"}</p>
              <p>Upcoming records: {patient.notes.length}</p>
              <p>Recent messages: {patient.messages.length}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
