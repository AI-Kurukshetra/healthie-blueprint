import Link from "next/link"
import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  MessageSquareMore,
} from "lucide-react"

import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getPatientPortalOverview,
  getShellData,
} from "@/lib/data/app-shell"
import { getActiveCarePlan } from "@/lib/data/care-plan"
import { formatDateTime, getAppointmentStatusPresentation } from "@/lib/utils"

const quickActions = [
  {
    href: "/portal/appointments",
    icon: CalendarDays,
    label: "Appointments",
    description: "View upcoming and completed visits",
  },
  {
    href: "/portal/records",
    icon: FileText,
    label: "Records",
    description: "Access signed notes and diagnoses",
  },
  {
    href: "/portal/care-plan",
    icon: ClipboardList,
    label: "Care Plan",
    description: "Track your active treatment plan",
  },
  {
    href: "/portal/labs",
    icon: FlaskConical,
    label: "Lab Results",
    description: "Review pending and completed labs",
  },
  {
    href: "/portal/messages",
    icon: MessageSquareMore,
    label: "Messages",
    description: "Secure communication with care team",
  },
  {
    href: "/portal/ehr",
    icon: HeartPulse,
    label: "EHR",
    description: "Medication and health history",
  },
] as const

export default async function PortalPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const [overview, carePlan] = await Promise.all([
    getPatientPortalOverview(shell.patient.id, shell.userId),
    getActiveCarePlan(shell.patient.id),
  ])
  const nextAppointmentStatus = overview.nextAppointment
    ? getAppointmentStatusPresentation(
        overview.nextAppointment.status,
        overview.nextAppointment.bookedBy
      )
    : null

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] bg-linear-to-br from-[var(--navy)] to-[var(--navy-light)] p-8 text-white">
        <h1 className="text-4xl font-bold text-white">Good morning, {shell.profile.full_name}</h1>
        <p className="mt-2 text-sm text-slate-300">Your health, in your hands.</p>
        {overview.nextAppointment ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--teal)] px-4 py-1.5 text-xs font-semibold text-white">
            Next appointment: {formatDateTime(overview.nextAppointment.scheduledAt)}
          </div>
        ) : null}
      </section>

      {overview.nextAppointment ? (
        <section className="rounded-2xl border border-[var(--border)] border-l-4 border-l-[var(--teal)] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="hf-label">Upcoming Appointment</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--navy)]">{overview.nextAppointment.providerName}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{formatDateTime(overview.nextAppointment.scheduledAt)}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{overview.nextAppointment.reason || "Scheduled follow-up"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={nextAppointmentStatus?.label}
                tone={nextAppointmentStatus?.tone}
                value={overview.nextAppointment.status}
              />
              <Link href="/portal/appointments">
                <Button variant="join">Join / View</Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map(({ description, href, icon: Icon, label }) => (
          <Link
            key={href}
            className="group rounded-2xl border border-[var(--border)] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--teal)]/40"
            href={href}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--teal-light)] text-[var(--teal-dark)]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="translate-x-0 text-[var(--teal-dark)] opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">{"->"}</span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--navy)]">{label}</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="hf-card py-5">
          <p className="hf-label">Upcoming Visits</p>
          <p className="mt-2 font-display text-3xl font-bold text-[var(--navy)]">{overview.upcomingAppointmentsCount}</p>
        </article>
        <article className="hf-card py-5">
          <p className="hf-label">Signed Records</p>
          <p className="mt-2 font-display text-3xl font-bold text-[var(--navy)]">{overview.signedNotesCount}</p>
        </article>
        <article className="hf-card py-5">
          <p className="hf-label">Unread Messages</p>
          <p className="mt-2 font-display text-3xl font-bold text-[var(--navy)]">{overview.unreadMessagesCount}</p>
        </article>
      </section>

      {carePlan ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="hf-label">Active Care Plan</p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--navy)]">{carePlan.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{carePlan.providerName}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge value={carePlan.status} />
              <Link href="/portal/care-plan">
                <Button variant="outline">Open Plan</Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <Badge className="bg-[var(--surface)] text-[var(--text-muted)]">Patient ID: {shell.patient.patient_id}</Badge>
      </section>
    </div>
  )
}
