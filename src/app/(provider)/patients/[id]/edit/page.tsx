import { notFound } from "next/navigation"

import { PatientForm } from "@/components/patients/PatientForm"
import { getPatientDetail } from "@/lib/data/provider"
import type { PatientFormValues, PatientInput } from "@/lib/validations/patient"

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ") || "",
  }
}

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const patient = await getPatientDetail(id)

  if (!patient) {
    notFound()
  }

  const { firstName, lastName } = splitFullName(patient.fullName)
  const initialValues: PatientFormValues = {
    allergies: patient.allergies,
    blood_group: (patient.bloodGroup as PatientInput["blood_group"]) ?? undefined,
    chronic_conditions: patient.chronicConditions,
    date_of_birth: patient.dateOfBirth ?? "",
    email: patient.email,
    emergency_contact: patient.emergencyContact ?? "",
    emergency_phone: patient.emergencyPhone ?? "",
    first_name: firstName,
    gender: (patient.gender as PatientInput["gender"]) ?? undefined,
    insurance_id: patient.insuranceId ?? "",
    insurance_provider: patient.insuranceProvider ?? "",
    last_name: lastName,
    phone: patient.phone ?? "",
  }

  return (
    <div className="space-y-6">
      <section className="hf-card">
        <h1 className="hf-page-title">Edit Patient</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Update demographic, medical, emergency, and insurance information.
        </p>
      </section>

      <PatientForm initialValues={initialValues} mode="edit" patientId={id} />
    </div>
  )
}
