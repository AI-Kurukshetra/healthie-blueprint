import { PatientForm } from "@/components/patients/PatientForm"

export default function AddPatientPage() {
  return (
    <div className="space-y-6">
      <section className="hf-card">
        <h1 className="hf-page-title">Add Patient</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Create a patient chart and linked portal account in one step.
        </p>
      </section>

      <PatientForm mode="create" />
    </div>
  )
}
