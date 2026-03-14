import { AppointmentsView } from "@/components/appointments/AppointmentsView"
import {
  getProviderAppointments,
  getProviderPatients,
  getProviderProfile,
} from "@/lib/data/provider"
import { createClient } from "@/lib/supabase/server"

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const provider = await getProviderProfile(user.id)

  if (!provider) {
    return null
  }

  const [appointments, patients] = await Promise.all([
    getProviderAppointments(provider.id),
    getProviderPatients(),
  ])

  return (
    <AppointmentsView
      appointments={appointments}
      patients={patients}
      providerAvailability={provider.available_days ?? []}
      slotDuration={provider.slot_duration}
    />
  )
}
