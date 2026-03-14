import "server-only"

import { subDays } from "date-fns"

import { createClient } from "@/lib/supabase/server"

export type AppointmentDayPoint = {
  count: number
  day: string
}

export type ConditionPoint = {
  name: string
  value: number
}

export async function getProviderAnalytics(providerId: string): Promise<{
  appointmentsByDay: AppointmentDayPoint[]
  conditionCounts: ConditionPoint[]
}> {
  const supabase = await createClient()
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(new Date(), 6 - index)
    return date.toISOString().split("T")[0]
  })

  const [appointmentsResult, patientsResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("scheduled_at")
      .gte("scheduled_at", last7Days[0])
      .eq("provider_id", providerId),
    supabase.from("patients").select("chronic_conditions"),
  ])

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message)
  }

  if (patientsResult.error) {
    throw new Error(patientsResult.error.message)
  }

  const appointmentsByDay = last7Days.map((day) => ({
    day: new Date(`${day}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
    }),
    count:
      appointmentsResult.data?.filter((appointment) =>
        appointment.scheduled_at.startsWith(day)
      ).length ?? 0,
  }))

  const conditionMap: Record<string, number> = {}
  patientsResult.data?.forEach((patient) => {
    patient.chronic_conditions?.forEach((condition) => {
      conditionMap[condition] = (conditionMap[condition] ?? 0) + 1
    })
  })

  const conditionCounts = Object.entries(conditionMap)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5)

  return {
    appointmentsByDay,
    conditionCounts,
  }
}
