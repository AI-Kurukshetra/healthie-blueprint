import { EmptyState } from "@/components/shared/EmptyState"
import { CarePlanView } from "@/components/portal/CarePlanView"
import { getShellData } from "@/lib/data/app-shell"
import { getActiveCarePlan } from "@/lib/data/care-plan"

export default async function PortalCarePlanPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const plan = await getActiveCarePlan(shell.patient.id)

  return <CarePlanView plan={plan} />
}
