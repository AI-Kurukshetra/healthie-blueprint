"use client"

import Link from "next/link"
import { useDeferredValue, useState, useTransition } from "react"
import { Search } from "lucide-react"

import { CancelAppointmentButton } from "@/components/appointments/CancelAppointmentButton"
import { ProviderPendingRequestActions } from "@/components/appointments/ProviderPendingRequestActions"
import { ScheduleAppointmentDialog } from "@/components/appointments/ScheduleAppointmentDialog"
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
} from "@/lib/utils"

type AppointmentsViewProps = {
  appointments: ProviderAppointmentListItem[]
  patients: ProviderPatientListItem[]
  providerAvailability: string[]
  slotDuration: number
}

const tabs = ["all", "today", "upcoming", "completed", "cancelled"] as const

function formatDay(date: string) {
  return new Date(date).toLocaleDateString("en-US", { day: "2-digit" })
}

function formatMonth(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short" }).toUpperCase()
}

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

  const pendingRequests = filteredAppointments.filter(
    (appointment) => appointment.status === "scheduled" && appointment.bookedBy === "patient"
  )
  const normalAppointments = filteredAppointments.filter(
    (appointment) => !(appointment.status === "scheduled" && appointment.bookedBy === "patient")
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="hf-page-title">Appointments</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Manage scheduling, confirmations, and cancellations.
          </p>
        </div>
        <ScheduleAppointmentDialog
          patients={patients}
          providerAvailability={providerAvailability}
          slotDuration={slotDuration}
        />
      </div>

      <section className="hf-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-fit items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] p-1">
            {tabs.map((item) => (
              <button
                key={item}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === item
                    ? "bg-[var(--teal)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--navy)]"
                }`}
                onClick={() => startTransition(() => setTab(item))}
                type="button"
              >
                {item === "all" ? "All" : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--teal)]" />
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

          {pendingRequests.length > 0 ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <div className="mb-3 border-l-4 border-amber-500 pl-3">
                <p className="text-sm font-semibold text-amber-700">Awaiting Confirmation</p>
              </div>
              <div className="space-y-3">
                {pendingRequests.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          ) : null}

          <div className="space-y-4">
            {normalAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AppointmentCard({
  appointment,
}: {
  appointment: ProviderAppointmentListItem
}) {
  const appointmentStatus = getAppointmentStatusPresentation(
    appointment.status,
    appointment.bookedBy
  )
  const isPatientRequestAwaitingResponse =
    appointment.status === "scheduled" && appointment.bookedBy === "patient"
  const canJoinConsultation =
    Boolean(appointment.meetingRoomId) &&
    (appointment.status === "confirmed" || appointment.status === "in_progress")
  const canCancel =
    appointment.status !== "cancelled" &&
    appointment.status !== "completed" &&
    appointment.status !== "in_progress" &&
    !(appointment.status === "scheduled" && appointment.bookedBy !== "provider") &&
    !(appointment.status === "scheduled" && appointment.bookedBy === "provider")

  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-white px-6 py-5 transition-all duration-200 hover:-translate-y-px hover:shadow-md">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[var(--teal-light)] px-4 py-3 text-center">
            <p className="font-display text-2xl font-bold text-[var(--teal-dark)]">{formatDay(appointment.scheduledAt)}</p>
            <p className="text-xs font-semibold tracking-[0.08em] text-[var(--text-muted)]">{formatMonth(appointment.scheduledAt)}</p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--navy)]">{appointment.patientName}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {formatDateTime(appointment.scheduledAt)} | {appointment.duration} min
            </p>
            <p className="mt-1 max-w-xl truncate text-sm italic text-[var(--text-muted)]">
              {appointment.reason || "Consultation"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{appointment.type.replace("_", " ")}</Badge>
              <StatusBadge
                label={appointmentStatus.label}
                tone={appointmentStatus.tone}
                value={appointment.status}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/appointments/${appointment.id}`}>
            <Button size="sm" variant="outline">View</Button>
          </Link>
          {canJoinConsultation ? (
            <Link href={`/consultation/${appointment.meetingRoomId}`}>
              <Button size="sm" variant="join">Join Call</Button>
            </Link>
          ) : null}
          {isPatientRequestAwaitingResponse ? (
            <ProviderPendingRequestActions appointmentId={appointment.id} />
          ) : null}
          {canCancel ? <CancelAppointmentButton appointmentId={appointment.id} /> : null}
        </div>
      </div>
    </article>
  )
}
