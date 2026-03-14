import { PatientsView } from "@/components/patients/PatientsView"
import { getProviderPatients } from "@/lib/data/provider"

export default async function PatientsPage() {
  const patients = await getProviderPatients()

  return <PatientsView patients={patients} />
}
