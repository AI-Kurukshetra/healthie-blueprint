import { notFound } from "next/navigation"

import { getCarePlan } from "@/actions/care-plan"
import { CarePlanForm } from "@/components/patients/CarePlanForm"
import { getPatientDetail } from "@/lib/data/provider"

export default async function PatientCarePlanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [patient, plan] = await Promise.all([getPatientDetail(id), getCarePlan(id)])

  if (!patient) {
    notFound()
  }

  return <CarePlanForm initialPlan={plan} patientId={patient.id} patientName={patient.fullName} />
}
