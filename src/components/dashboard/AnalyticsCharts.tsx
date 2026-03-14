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

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export function AnalyticsCharts({
  appointmentsByDay,
  conditionCounts,
}: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-800">
          Appointments This Week
        </h3>
        <ResponsiveContainer height={220} width="100%">
          <BarChart data={appointmentsByDay}>
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-800">
          Patients by Condition
        </h3>
        {conditionCounts.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
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
                outerRadius={80}
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
  )
}
