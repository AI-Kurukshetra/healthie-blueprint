"use client"

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type AnalyticsChartsProps = {
  appointmentsByDay: Array<{
    count: number
    day: string
  }>
  conditionCounts: Array<{
    name: string
    value: number
  }>
}

const COLORS = ["#00D4B8", "#4FDCC8", "#99EADF", "#00B09C", "#1E3A5F"]

export function AnalyticsCharts({
  appointmentsByDay,
  conditionCounts,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
        <div className="bg-[var(--navy)] px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Appointments This Week</h3>
        </div>
        <div className="p-5">
          <ResponsiveContainer height={220} width="100%">
            <BarChart data={appointmentsByDay}>
              <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#00D4B8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
        <div className="bg-[var(--navy)] px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Patients by Condition</h3>
        </div>
        <div className="p-5">
          {conditionCounts.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-[var(--text-muted)]">
              No condition data yet
            </div>
          ) : (
            <ResponsiveContainer height={220} width="100%">
              <PieChart>
                <Pie
                  data={conditionCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={78}
                >
                  {conditionCounts.map((condition, index) => (
                    <Cell
                      key={`${condition.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
