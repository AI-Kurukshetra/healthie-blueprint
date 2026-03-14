import {
  CalendarDays,
  FileText,
  FlaskConical,
  MessageSquareMore,
  Users,
} from "lucide-react"

import { AnalyticsCharts } from "@/components/dashboard/AnalyticsCharts"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import {
  getProviderDashboardData,
  getShellData,
} from "@/lib/data/app-shell"
import { getProviderAnalytics } from "@/lib/data/analytics"
import { formatDateTime, formatTime } from "@/lib/utils"

const statCards = [
  {
    key: "totalPatients",
    label: "Total Patients",
    icon: Users,
    subtitle: "Accessible patient records",
  },
  {
    key: "todaysAppointmentsCount",
    label: "Today's Appointments",
    icon: CalendarDays,
    subtitle: "Scheduled for today",
  },
  {
    key: "pendingNotesCount",
    label: "Pending Notes",
    icon: FileText,
    subtitle: "Draft notes awaiting signature",
  },
  {
    key: "pendingLabsCount",
    label: "Pending Labs",
    icon: FlaskConical,
    subtitle: "Labs awaiting results",
  },
  {
    key: "unreadMessagesCount",
    label: "Unread Messages",
    icon: MessageSquareMore,
    subtitle: "New communication today",
  },
] as const

function AppointmentSection({
  appointments,
  description,
  title,
}: {
  appointments: Awaited<ReturnType<typeof getProviderDashboardData>>["todaysQueue"]
  description: string
  title: string
}) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        description={description}
        title={`No ${title.toLowerCase()} yet`}
      />
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <article
          key={appointment.id}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950">
                  {appointment.patientName}
                </h3>
                <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  {appointment.patientId}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                {appointment.reason || "General consultation"}
              </p>
              <p className="text-sm text-slate-500">
                {title === "Today's Queue"
                  ? formatTime(appointment.scheduledAt)
                  : formatDateTime(appointment.scheduledAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={appointment.status} />
              <Badge className="rounded-full border border-slate-200 bg-white text-slate-700">
                {appointment.type.replace("_", " ")}
              </Badge>
            </div>
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

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-sky-600">Care overview</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Welcome back, {shell.profile.full_name}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          You have {dashboard.todaysAppointmentsCount} appointments scheduled today and{" "}
          {dashboard.pendingNotesCount} notes waiting for review, plus{" "}
          {dashboard.pendingLabsCount} labs awaiting results.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {statCards.map(({ icon: Icon, key, label, subtitle }) => (
          <article
            key={key}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="text-2xl font-semibold text-slate-950">
                  {dashboard[key]}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {key === "pendingLabsCount"
                ? `${dashboard.abnormalLabsCount} abnormal`
                : subtitle}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Today&apos;s Queue</h3>
            <p className="text-sm text-slate-500">
              Active visits and check-ins scheduled for the current day.
            </p>
          </div>
          <AppointmentSection
            appointments={dashboard.todaysQueue}
            description="New appointments scheduled for today will appear here."
            title="Today's Queue"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">
              Upcoming Appointments
            </h3>
            <p className="text-sm text-slate-500">
              The next visits on your calendar beyond today.
            </p>
          </div>
          <AppointmentSection
            appointments={dashboard.upcomingAppointments}
            description="Future appointments will populate once new bookings are confirmed."
            title="Upcoming Appointments"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Practice Analytics</h3>
          <p className="text-sm text-slate-500">
            Weekly booking trends and the most common patient conditions in your roster.
          </p>
        </div>
        <AnalyticsCharts
          appointmentsByDay={analytics.appointmentsByDay}
          conditionCounts={analytics.conditionCounts}
        />
      </section>
    </div>
  )
}
