import Link from "next/link"
import { notFound } from "next/navigation"

import { EHRTimeline } from "@/components/patients/EHRTimeline"
import { Button } from "@/components/ui/button"
import { getPatientDetail } from "@/lib/data/provider"
import { getPatientTimeline } from "@/lib/data/timeline"

export default async function PatientTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [patient, timeline] = await Promise.all([
    getPatientDetail(id),
    getPatientTimeline(id),
  ])

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">Patient timeline</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Timeline for {patient.fullName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review appointments, notes, and signed records in one chronological view.
            </p>
          </div>
          <Link href={`/patients/${patient.id}`}>
            <Button variant="outline">Back to Patient</Button>
          </Link>
        </div>
      </section>

      <EHRTimeline items={timeline} />
    </div>
  )
}
