"use client"

import { useState } from "react"
import { CircleAlert, CircleCheck, Clock3, Download } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PatientLabListItem } from "@/lib/data/labs"
import { formatDate } from "@/lib/utils"

function getResultTone(order: PatientLabListItem) {
  if (order.status !== "completed") {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Clock3,
      label: "Pending",
    }
  }

  if (order.isAbnormal) {
    return {
      className: "border-rose-200 bg-rose-50 text-rose-700",
      icon: CircleAlert,
      label: "Abnormal",
    }
  }

  return {
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CircleCheck,
    label: "Normal",
  }
}

export function LabResultCard({ order }: { order: PatientLabListItem }) {
  const [open, setOpen] = useState(false)
  const tone = getResultTone(order)
  const ToneIcon = tone.icon

  return (
    <>
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`rounded-full border ${tone.className}`}>
                <ToneIcon className="h-3.5 w-3.5" />
                {tone.label}
              </Badge>
              <h3 className="text-lg font-semibold text-slate-950">{order.testName}</h3>
              <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                {order.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">
              {order.orderNumber} - Ordered by {order.providerName}
            </p>
            <p className="text-sm text-slate-500">{formatDate(order.orderedAt)}</p>
            <p className="text-sm text-slate-600">
              {order.resultSummary ||
                order.instructions ||
                "Please visit the lab and follow the provided instructions."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
              {order.status === "completed" ? "View Details" : "View"}
            </Button>
            {order.fileUrl ? (
              <a download href={order.fileUrl}>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </a>
            ) : null}
          </div>
        </div>
      </article>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{order.testName}</DialogTitle>
            <DialogDescription>
              {order.orderNumber} - Ordered by {order.providerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`rounded-full border ${tone.className}`}>
                <ToneIcon className="h-3.5 w-3.5" />
                {tone.label}
              </Badge>
              <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                {order.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p>Ordered: {formatDate(order.orderedAt)}</p>
              {order.reportedAt ? <p>Reported: {formatDate(order.reportedAt)}</p> : null}
              {order.instructions ? <p>Instructions: {order.instructions}</p> : null}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Summary</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {order.resultSummary || "No summary available yet."}
              </p>
            </div>
            {order.findings ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Findings</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{order.findings}</p>
              </div>
            ) : null}
            {order.notes ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Provider Notes</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{order.notes}</p>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
