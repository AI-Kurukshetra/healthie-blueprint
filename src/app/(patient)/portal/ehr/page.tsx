import { HeartPulse } from "lucide-react"

import { PrescriptionPreviewDialog } from "@/components/patients/PrescriptionPreviewDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { getPatientPortalEHR } from "@/lib/data/ehr"
import { getShellData } from "@/lib/data/app-shell"
import { formatDate } from "@/lib/utils"

function formatHistoryType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function PortalEHRPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const ehr = await getPatientPortalEHR(shell.patient.id)
  const groupedHistory = ehr.history.reduce<Record<string, typeof ehr.history>>((groups, item) => {
    const key = item.historyType
    groups[key] = [...(groups[key] ?? []), item]
    return groups
  }, {})

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <HeartPulse className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-rose-600">Health records</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              My Health Records
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              View your medications, medical history, prescriptions, allergies, and
              chronic conditions in one read-only record.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">My Medications</h3>
          <div className="mt-4 space-y-3">
            {ehr.activeMedications.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No active medications.
              </p>
            ) : (
              ehr.activeMedications.map((medication) => (
                <div key={medication.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-950">
                    {medication.name} {medication.dosage}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{medication.frequency}</p>
                  {medication.reason ? (
                    <p className="mt-2 text-sm text-slate-500">{medication.reason}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">My Medical History</h3>
          <div className="mt-4 space-y-4">
            {ehr.history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No medical history recorded.
              </p>
            ) : (
              Object.entries(groupedHistory).map(([type, records]) => (
                <div key={type} className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {formatHistoryType(type)}
                  </h4>
                  {records.map((record) => (
                    <div key={record.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-slate-950">{record.title}</p>
                        {record.isResolved ? (
                          <StatusBadge label="Resolved" tone="confirmed" value="resolved" />
                        ) : null}
                      </div>
                      {record.description ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {record.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">
                        {record.dateOccurred
                          ? formatDate(record.dateOccurred)
                          : formatDate(record.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">My Prescriptions</h3>
          <div className="mt-4 space-y-3">
            {ehr.prescriptions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No prescriptions yet.
              </p>
            ) : (
              ehr.prescriptions.map((prescription) => (
                <div key={prescription.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-950">{prescription.rxNumber}</p>
                        <StatusBadge value={prescription.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Issued {formatDate(prescription.issuedAt)}
                      </p>
                    </div>
                    <PrescriptionPreviewDialog prescription={prescription} />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">Allergies & Conditions</h3>
          <div className="mt-5 space-y-6">
            <div>
              <p className="text-sm font-medium text-rose-700">Allergies</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ehr.allergies.length > 0 ? (
                  ehr.allergies.map((item) => (
                    <Badge
                      key={item}
                      className="rounded-full border border-rose-200 bg-rose-50 text-rose-700"
                    >
                      {item}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No known allergies.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-700">Chronic Conditions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ehr.chronicConditions.length > 0 ? (
                  ehr.chronicConditions.map((item) => (
                    <Badge
                      key={item}
                      className="rounded-full border border-amber-200 bg-amber-50 text-amber-700"
                    >
                      {item}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No chronic conditions recorded.</p>
                )}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
