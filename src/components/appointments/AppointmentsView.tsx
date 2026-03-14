"use client"

import Link from "next/link"
import { useDeferredValue, useState, useTransition } from "react"
import { Search } from "lucide-react"

import { CancelAppointmentButton } from "@/components/appointments/CancelAppointmentButton"
import { ProviderPendingRequestActions } from "@/components/appointments/ProviderPendingRequestActions"
import { ScheduleAppointmentDialog } from "@/components/appointments/ScheduleAppointmentDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FetchingOverlay } from "@/components/shared/FetchingOverlay"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import type {
  ProviderAppointmentListItem,
  ProviderPatientListItem,
} from "@/lib/data/provider"
import {
  formatDateTime,
  getAppointmentStatusPresentation,
  getInitials,
} from "@/lib/utils"

type AppointmentsViewProps = {
  appointments: ProviderAppointmentListItem[]
  patients: ProviderPatientListItem[]
  providerAvailability: string[]
  slotDuration: number
}

const tabs = ["all", "today", "upcoming", "completed", "cancelled"] as const

export function AppointmentsView({
  appointments,
  patients,
  providerAvailability,
  slotDuration,
}: AppointmentsViewProps) {
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<(typeof tabs)[number]>("all")
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const now = new Date()

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.scheduledAt)
    const sameDay = appointmentDate.toDateString() === now.toDateString()
    const future = appointmentDate > now
    const queryMatches =
      !deferredQuery.trim() ||
      appointment.patientName.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      appointment.patientId.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      (appointment.reason ?? "").toLowerCase().includes(deferredQuery.toLowerCase())

    const tabMatches =
      tab === "all" ||
      (tab === "today" && sameDay) ||
      (tab === "upcoming" &&
        future &&
        appointment.status !== "completed" &&
        appointment.status !== "cancelled") ||
      (tab === "completed" && appointment.status === "completed") ||
      (tab === "cancelled" && appointment.status === "cancelled")

    return queryMatches && tabMatches
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Appointments</h2>
          <p className="mt-2 text-sm text-slate-600">
            Manage visit scheduling, status, and cancellations in one place.
          </p>
        </div>
        <ScheduleAppointmentDialog
          patients={patients}
          providerAvailability={providerAvailability}
          slotDuration={slotDuration}
        />
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item}
                className={`min-h-11 rounded-full px-4 text-sm font-medium transition ${
                  tab === item
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                onClick={() => startTransition(() => setTab(item))}
                type="button"
              >
                {item === "all"
                  ? "All"
                  : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search appointments"
              value={query}
            />
          </div>
        </div>
      </section>

      {filteredAppointments.length === 0 ? (
        <EmptyState
          description="Scheduled appointments matching the current filters will appear here."
          title="No appointments found"
        />
      ) : (
        <div className="relative space-y-4">
          <FetchingOverlay isVisible={isPending || deferredQuery !== query} />
          {filteredAppointments.map((appointment) => {
            const appointmentStatus = getAppointmentStatusPresentation(
              appointment.status,
              appointment.bookedBy
            )
            const isPatientRequestAwaitingResponse =
              appointment.status === "scheduled" && appointment.bookedBy === "patient"
            const canJoinConsultation =
              Boolean(appointment.meetingRoomId) &&
              (appointment.status === "confirmed" ||
                appointment.status === "in_progress")
            const canCancel =
              appointment.status !== "cancelled" &&
              appointment.status !== "completed" &&
              appointment.status !== "in_progress" &&
              !(appointment.status === "scheduled" && appointment.bookedBy !== "provider") &&
              !(appointment.status === "scheduled" && appointment.bookedBy === "provider")

            return (
              <article
                key={appointment.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar size="lg">
                      <AvatarImage
                        alt={appointment.patientName}
                        src={appointment.patientAvatarUrl ?? undefined}
                      />
                      <AvatarFallback>{getInitials(appointment.patientName)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-950">
                          {appointment.patientName}
                        </h3>
                        <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                          {appointment.patientId}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(appointment.scheduledAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 xl:max-w-md xl:flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        {appointment.type.replace("_", " ")}
                      </Badge>
                      <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        {appointment.duration} min
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      {appointment.reason || "Consultation"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 xl:items-end">
                    <StatusBadge
                      label={appointmentStatus.label}
                      tone={appointmentStatus.tone}
                      value={appointment.status}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/appointments/${appointment.id}`}>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </Link>
                      {canJoinConsultation ? (
                        <Link href={`/consultation/${appointment.meetingRoomId}`}>
                          <Button size="sm">Join Call</Button>
                        </Link>
                      ) : null}
                      {isPatientRequestAwaitingResponse ? (
                        <ProviderPendingRequestActions appointmentId={appointment.id} />
                      ) : null}
                      {canCancel ? (
                        <CancelAppointmentButton appointmentId={appointment.id} />
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
