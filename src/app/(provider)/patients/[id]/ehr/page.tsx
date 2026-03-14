import { notFound } from "next/navigation"

import { PatientEHRWorkspace } from "@/components/patients/PatientEHRWorkspace"
import { getProviderPatientEHR } from "@/lib/data/ehr"

export default async function PatientEHRPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ehr = await getProviderPatientEHR(id)

  if (!ehr) {
    notFound()
  }

  return <PatientEHRWorkspace {...ehr} />
}
