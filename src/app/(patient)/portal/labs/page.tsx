import { PatientLabsView } from "@/components/portal/PatientLabsView"
import { EmptyState } from "@/components/shared/EmptyState"
import { getShellData } from "@/lib/data/app-shell"
import { getPatientLabOrders } from "@/lib/data/labs"

export default async function PortalLabsPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const orders = await getPatientLabOrders(shell.patient.id)

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">My Lab Results</h2>
        <p className="mt-2 text-sm text-slate-600">
          Review pending tests, completed reports, and abnormal findings from your care
          team.
        </p>
      </section>

      <PatientLabsView orders={orders} />
    </div>
  )
}
