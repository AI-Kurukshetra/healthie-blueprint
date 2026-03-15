import Link from "next/link"
import {
  CalendarDays,
  FileText,
  MessageSquareMore,
  Users,
} from "lucide-react"

import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getProviderDashboardData,
  getShellData,
} from "@/lib/data/app-shell"
import { getProviderAnalytics } from "@/lib/data/analytics"
import { formatDateTime, formatTime } from "@/lib/utils"

const statCards = [
  {
    key: "totalPatients",
    label: "Patients",
    icon: Users,
    accent: "bg-[var(--teal)]",
    subtitle: "Active roster",
  },
  {
    key: "todaysAppointmentsCount",
    label: "Appointments",
    icon: CalendarDays,
    accent: "bg-[#8B5CF6]",
    subtitle: "Scheduled today",
  },
  {
    key: "pendingNotesCount",
    label: "Notes",
    icon: FileText,
    accent: "bg-[#F59E0B]",
    subtitle: "Awaiting signature",
  },
  {
    key: "unreadMessagesCount",
    label: "Messages",
    icon: MessageSquareMore,
    accent: "bg-[#F43F5E]",
    subtitle: "Unread threads",
  },
] as const

function QueueList({
  appointments,
}: {
  appointments: Awaited<ReturnType<typeof getProviderDashboardData>>["todaysQueue"]
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-b-xl border border-t-0 border-[var(--border)] bg-white p-5">
        <EmptyState
          description="New appointments scheduled today will appear here."
          title="Queue is clear"
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-b-xl border border-t-0 border-[var(--border)] bg-white">
      {appointments.map((appointment) => {
        const canJoin =
          Boolean(appointment.meetingRoomId) &&
          (appointment.status === "confirmed" || appointment.status === "in_progress")

        return (
          <article key={appointment.id} className="border-b border-[#F1F5F9] px-5 py-4 last:border-b-0">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--navy)]">{appointment.patientName}</p>
                  <Badge variant="outline">{appointment.patientId}</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{formatTime(appointment.scheduledAt)}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{appointment.reason || "General consultation"}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{appointment.type.replace("_", " ")}</Badge>
                <StatusBadge value={appointment.status} />
                {canJoin ? (
                  <Link href={`/consultation/${appointment.meetingRoomId}`}>
                    <Button size="sm" variant="join">Join Call</Button>
                  </Link>
                ) : (
                  <Link href={`/appointments/${appointment.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function UpcomingList({
  appointments,
}: {
  appointments: Awaited<ReturnType<typeof getProviderDashboardData>>["upcomingAppointments"]
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-b-xl border border-t-0 border-[var(--border)] bg-white p-5">
        <EmptyState
          description="Upcoming appointments beyond today will appear here."
          title="No upcoming visits"
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-b-xl border border-t-0 border-[var(--border)] bg-white">
      {appointments.slice(0, 6).map((appointment) => (
        <article key={appointment.id} className="border-b border-[#F1F5F9] px-5 py-4 last:border-b-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--navy)]">{appointment.patientName}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(appointment.scheduledAt)}</p>
            </div>
            <StatusBadge value={appointment.status} />
          </div>
        </article>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const shell = await getShellData("provider")

  if (!shell.provider) {
    return (
      <EmptyState
        description="Your provider record could not be loaded for this account."
        title="Provider profile missing"
      />
    )
  }

  const [dashboard, analytics] = await Promise.all([
    getProviderDashboardData(shell.provider.id, shell.userId),
    getProviderAnalytics(shell.provider.id),
  ])

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const displayName = shell.profile.full_name.replace(/^Dr\.\s*/i, "")

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="hf-page-title">Good morning, Dr. {displayName}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Here&apos;s what&apos;s happening today.</p>
        </div>
        <p className="text-sm text-[var(--text-muted)]">{todayLabel}</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ icon: Icon, key, label, accent, subtitle }) => (
          <article key={key} className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <span className={`absolute top-0 left-0 h-full w-1 ${accent}`} />
            <Icon className="pointer-events-none absolute top-5 right-5 h-10 w-10 text-[var(--navy)]/10" />
            <p className="hf-label">{label}</p>
            <p className="mt-2 font-display text-4xl font-bold text-[var(--navy)]">{dashboard[key]}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{subtitle}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <div className="flex items-center justify-between rounded-t-xl bg-[var(--navy)] px-5 py-4">
            <p className="text-sm font-semibold text-white">Today&apos;s Queue</p>
            <Badge className="bg-[var(--teal)] text-white">{dashboard.todaysQueue.length}</Badge>
          </div>
          <QueueList appointments={dashboard.todaysQueue} />
        </div>

        <div>
          <div className="flex items-center justify-between rounded-t-xl bg-[var(--navy)] px-5 py-4">
            <p className="text-sm font-semibold text-white">Upcoming</p>
            <Badge className="bg-[var(--teal)] text-white">{dashboard.upcomingAppointments.length}</Badge>
          </div>
          <UpcomingList appointments={dashboard.upcomingAppointments} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="hf-section-title">Practice Analytics</h2>
          <p className="text-sm text-[var(--text-muted)]">Weekly trends and top patient conditions</p>
        </div>
        <AnalyticsCharts
          appointmentsByDay={analytics.appointmentsByDay}
          conditionCounts={analytics.conditionCounts}
        />
      </section>
    </div>
  )
}
