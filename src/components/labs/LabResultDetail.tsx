import type { ReactNode } from "react"
import Link from "next/link"
import { Download } from "lucide-react"

import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ProviderLabOrderDetail } from "@/lib/data/labs"
import { formatDate, formatDateTime } from "@/lib/utils"

function getPriorityBadge(priority: string) {
  if (priority === "stat") {
    return "border-red-200 bg-red-100 text-red-700"
  }

  if (priority === "urgent") {
    return "border-orange-200 bg-orange-100 text-orange-700"
  }

  return "border-slate-200 bg-slate-100 text-slate-500"
}

function formatPriorityLabel(priority: string) {
  return priority === "stat"
    ? "STAT"
    : priority.charAt(0).toUpperCase() + priority.slice(1)
}

function formatTestTypeLabel(value: string) {
  return value === "ecg"
    ? "ECG"
    : value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

type LabResultDetailProps = {
  actions?: ReactNode
  order: ProviderLabOrderDetail
}

export function LabResultDetail({ actions, order }: LabResultDetailProps) {
  return (
    <div className="space-y-6">
      <section className="hf-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-sky-600">Lab order detail</p>
              <Badge className={`rounded-full border ${getPriorityBadge(order.priority)}`}>
                {formatPriorityLabel(order.priority)}
              </Badge>
              <StatusBadge value={order.status} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {order.testName}
            </h1>
            <p className="text-sm text-slate-600">
              {order.orderNumber} - {formatTestTypeLabel(order.testType)}
            </p>
            <p className="text-sm text-slate-600">
              Patient:{" "}
              <Link className="font-medium text-sky-600" href={`/patients/${order.patientId}`}>
                {order.patientName} ({order.patientRecordId})
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/labs">
              <Button variant="outline">Back to Labs</Button>
            </Link>
            {actions}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Order Information</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Ordered: {formatDateTime(order.orderedAt)}</p>
            <p>Status: {order.status.replace("_", " ")}</p>
            <p>Priority: {formatPriorityLabel(order.priority)}</p>
            <p>Ordered by: {order.providerName}</p>
            {order.instructions ? <p>Instructions: {order.instructions}</p> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Timeline</h2>
          <div className="mt-4 space-y-3">
            {order.timeline.map((entry, index) => (
              <div
                key={`${entry.title}-${entry.date}-${index}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <p className="text-sm font-medium text-slate-950">{entry.title}</p>
                <p className="mt-1 text-sm text-slate-600">{entry.description}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(entry.date)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="hf-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Result</h2>
            <p className="mt-1 text-sm text-slate-600">
              Completed results, findings, report file, and provider notes.
            </p>
          </div>
          {order.fileUrl ? (
            <a download href={order.fileUrl}>
              <Button variant="outline">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </a>
          ) : null}
        </div>

        {order.resultSummary ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950">Summary</h3>
                <Badge
                  className={`rounded-full border ${
                    order.isAbnormal
                      ? "border-rose-200 bg-rose-100 text-rose-700"
                      : "border-emerald-200 bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {order.isAbnormal ? "Abnormal" : "Normal"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{order.resultSummary}</p>
              <p className="mt-3 text-xs text-slate-500">
                Reported: {formatDate(order.reportedAt ?? order.updatedAt)}
              </p>
            </div>

            {order.findings ? (
              <div className="rounded-3xl border border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-950">Findings</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{order.findings}</p>
              </div>
            ) : null}

            {order.notes ? (
              <div className="rounded-3xl border border-slate-200 p-5">
                <h3 className="text-base font-semibold text-slate-950">Provider Notes</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{order.notes}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              description="Upload the result once the sample has been processed."
              title="No result uploaded yet"
            />
          </div>
        )}
      </section>
    </div>
  )
}

