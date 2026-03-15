import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { getPatientRecords, getShellData } from "@/lib/data/app-shell"
import { formatDate } from "@/lib/utils"

export default async function PortalRecordsPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const records = await getPatientRecords(shell.patient.id)

  return (
    <div className="space-y-6">
      <section className="hf-card">
        <h2 className="hf-page-title">My Records</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Signed clinical notes and diagnoses shared with your account.
        </p>
      </section>

      {records.length === 0 ? (
        <EmptyState
          description="Signed notes will appear after your provider completes and signs them."
          title="No records available"
        />
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-2xl border border-[var(--border)] bg-white p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {record.providerName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Signed {record.signedAt ? formatDate(record.signedAt) : "recently"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {record.diagnosisCodes.length > 0 ? (
                      record.diagnosisCodes.map((code) => (
                        <Badge
                          key={code}
                          className="rounded-full bg-[var(--surface)] text-[var(--text-muted)]"
                        >
                          {code}
                        </Badge>
                      ))
                    ) : (
                      <Badge className="rounded-full bg-[var(--surface)] text-[var(--text-muted)]">
                        No diagnosis code
                      </Badge>
                    )}
                  </div>
                </div>
                <StatusBadge value={record.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

