import Link from "next/link"
import { notFound } from "next/navigation"

import { CareTeamTab } from "@/components/patients/CareTeamTab"
import { Button } from "@/components/ui/button"
import { getCareTeam, getCareTeamProviderOptions } from "@/lib/data/care-team"
import { getPatientDetail } from "@/lib/data/provider"

export default async function PatientCareTeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [patient, members, providerOptions] = await Promise.all([
    getPatientDetail(id),
    getCareTeam(id),
    getCareTeamProviderOptions(),
  ])

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">Care coordination</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Care Team for {patient.fullName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage the providers who can collaborate on this patient&apos;s care plan.
            </p>
          </div>
          <Link href={`/patients/${patient.id}`}>
            <Button variant="outline">Back to Patient</Button>
          </Link>
        </div>
      </section>

      <CareTeamTab members={members} patientId={patient.id} providerOptions={providerOptions} />
    </div>
  )
}
