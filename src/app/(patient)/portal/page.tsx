import Link from "next/link"
import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartHandshake,
  HeartPulse,
  MessageSquareMore,
} from "lucide-react"

import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  getPatientPortalOverview,
  getShellData,
} from "@/lib/data/app-shell"
import { getActiveCarePlan } from "@/lib/data/care-plan"
import { formatDateTime, getAppointmentStatusPresentation } from "@/lib/utils"

const quickActions = [
  {
    accentClass: "bg-slate-900 text-white",
    href: "/portal/appointments",
    icon: CalendarDays,
    label: "My Appointments",
    description: "Review upcoming visits and completed bookings.",
  },
  {
    accentClass: "bg-slate-900 text-white",
    href: "/portal/records",
    icon: FileText,
    label: "My Records",
    description: "Open signed clinical notes and follow-up guidance.",
  },
  {
    accentClass: "bg-red-50 text-red-600",
    href: "/portal/ehr",
    icon: HeartPulse,
    label: "My Health Records",
    description: "Review medications, prescriptions, and medical history.",
  },
  {
    accentClass: "bg-amber-50 text-amber-700",
    href: "/portal/labs",
    icon: FlaskConical,
    label: "My Lab Results",
    description: "Check pending tests, completed reports, and abnormal findings.",
  },
  {
    accentClass: "bg-slate-900 text-white",
    href: "/portal/messages",
    icon: MessageSquareMore,
    label: "Messages",
    description: "Read updates from your care team securely.",
  },
  {
    accentClass: "bg-slate-900 text-white",
    href: "/portal/care-plan",
    icon: ClipboardList,
    label: "My Care Plan",
    description: "Review active goals, treatment instructions, and follow-up guidance.",
  },
  {
    accentClass: "bg-slate-900 text-white",
    href: "/portal",
    icon: HeartHandshake,
    label: "Care Overview",
    description: "Return to your portal summary at any time.",
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
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-sky-600">Patient portal</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Good morning, {shell.profile.full_name}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Your care updates, messages, and records are organized here so you can
          stay current without chasing details.
        </p>
      </section>

      {overview.nextAppointment ? (
        <section className="rounded-[28px] border border-sky-200 bg-sky-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-sky-700">Next appointment</p>
              <h3 className="text-2xl font-semibold text-slate-950">
                {overview.nextAppointment.providerName}
              </h3>
              <p className="text-sm text-slate-600">
                {formatDateTime(overview.nextAppointment.scheduledAt)}
              </p>
              <p className="text-sm text-slate-600">
                {overview.nextAppointment.reason || "Scheduled follow-up"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={nextAppointmentStatus?.label}
                tone={nextAppointmentStatus?.tone}
                value={overview.nextAppointment.status}
              />
              <Link href="/portal/appointments">
                <Button className="h-11 rounded-xl bg-sky-500 px-4 text-white hover:bg-sky-600">
                  View appointments
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {carePlan ? (
        <section className="rounded-[28px] border border-violet-200 bg-violet-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-violet-700">Active care plan</p>
              <h3 className="text-2xl font-semibold text-slate-950">{carePlan.title}</h3>
              <p className="text-sm text-slate-600">
                {carePlan.providerName} is actively guiding this plan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={carePlan.status} />
              <Link href="/portal/care-plan">
                <Button className="h-11 rounded-xl bg-violet-600 px-4 text-white hover:bg-violet-700">
                  View plan
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Upcoming Visits</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {overview.upcomingAppointmentsCount}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Signed Records</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {overview.signedNotesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Unread Messages</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {overview.unreadMessagesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Patient ID</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {shell.patient.patient_id}
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map(({ accentClass, description, href, icon: Icon, label }) => (
          <Link
            key={href}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
            href={href}
          >
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
