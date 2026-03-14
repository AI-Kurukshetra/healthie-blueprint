import { PatientForm } from "@/components/patients/PatientForm"

export default function AddPatientPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Add Patient</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create a patient chart and linked portal account in one step.
        </p>
      </section>

      <PatientForm mode="create" />
    </div>
  )
}
