import Link from "next/link"

import { PatientPendingConfirmationSection } from "@/components/appointments/PatientPendingConfirmationSection"
import { PatientScheduleAppointmentDialog } from "@/components/appointments/PatientScheduleAppointmentDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getPatientBookableProviders,
  getPatientAppointments,
  getShellData,
} from "@/lib/data/app-shell"
import { formatDateTime, getAppointmentStatusPresentation } from "@/lib/utils"

export default async function PortalAppointmentsPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const [appointments, providers] = await Promise.all([
    getPatientAppointments(shell.patient.id),
    getPatientBookableProviders(),
  ])
  const pendingConfirmations = appointments.filter(
    (appointment) =>
      appointment.status === "scheduled" && appointment.bookedBy === "provider"
  )
  const visibleAppointments = appointments.filter(
    (appointment) =>
      !(appointment.status === "scheduled" && appointment.bookedBy === "provider")
  )

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">My Appointments</h2>
            <p className="mt-2 text-sm text-slate-600">
              Upcoming and historical appointments available in your account.
            </p>
            {providers.length === 0 ? (
              <p className="mt-2 text-sm text-amber-700">
                Booking is unavailable because no providers are currently available.
              </p>
            ) : null}
          </div>
          <PatientScheduleAppointmentDialog providers={providers} />
        </div>
      </section>

      <PatientPendingConfirmationSection appointments={pendingConfirmations} />

      {appointments.length === 0 ? (
        <EmptyState
          description="Use Book Appointment to schedule your first visit."
          title="No appointments yet"
        />
      ) : visibleAppointments.length > 0 ? (
        <div className="space-y-4">
          {visibleAppointments.map((appointment) => {
            const appointmentStatus = getAppointmentStatusPresentation(
              appointment.status,
              appointment.bookedBy
            )

            return (
              <article
                key={appointment.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {appointment.providerName}
                      </h3>
                      <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        {appointment.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {appointment.reason || "Consultation"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <StatusBadge
                      label={appointmentStatus.label}
                      tone={appointmentStatus.tone}
                      value={appointment.status}
                    />
                    {appointment.meetingRoomId &&
                    (appointment.status === "confirmed" ||
                      appointment.status === "in_progress") ? (
                      <Link href={`/consultation/${appointment.meetingRoomId}`}>
                        <Button size="sm">Join Call</Button>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
