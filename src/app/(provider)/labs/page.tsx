import { EmptyState } from "@/components/shared/EmptyState"
import { LabOrderList } from "@/components/labs/LabOrderList"
import { getShellData } from "@/lib/data/app-shell"
import { getProviderAppointments } from "@/lib/data/provider"
import {
  getOrderLabPatients,
  getProviderLabOrders,
} from "@/lib/data/labs"
import { createClient } from "@/lib/supabase/server"
import { formatDateTime } from "@/lib/utils"

export default async function LabsPage() {
  const shell = await getShellData("provider")

  if (!shell.provider) {
    return (
      <EmptyState
        description="Your provider record could not be loaded for this account."
        title="Provider profile missing"
      />
    )
  }

  const [orders, patients, appointments] = await Promise.all([
    getProviderLabOrders(),
    getOrderLabPatients(),
    getProviderAppointments(shell.provider.id),
  ])
  const supabase = await createClient()
  const { data: rawAppointments } = await supabase
    .from("appointments")
    .select("id, patient_id")
    .eq("provider_id", shell.provider.id)
    .neq("status", "cancelled")

  const patientIdByAppointment = new Map(
    (rawAppointments ?? []).map((appointment) => [appointment.id, appointment.patient_id])
  )
  const appointmentOptions = appointments
    .filter((appointment) => patientIdByAppointment.has(appointment.id))
    .map((appointment) => ({
      id: appointment.id,
      label: `${appointment.patientName} - ${formatDateTime(appointment.scheduledAt)}`,
      patientId: patientIdByAppointment.get(appointment.id) ?? "",
    }))

  return (
    <LabOrderList
      appointments={appointmentOptions}
      orders={orders}
      patients={patients}
    />
  )
}
