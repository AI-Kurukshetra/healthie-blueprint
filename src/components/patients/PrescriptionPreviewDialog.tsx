"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { EHRPrescription } from "@/lib/data/ehr"
import { formatDateTime } from "@/lib/utils"

type PrescriptionPreviewDialogProps = {
  prescription: EHRPrescription
  showPrint?: boolean
  triggerLabel?: string
}

export function PrescriptionPreviewDialog({
  prescription,
  showPrint = false,
  triggerLabel = "View",
}: PrescriptionPreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const medicationSummary = useMemo(
    () =>
      prescription.medications.map((medication, index) => (
        <div
          key={`${prescription.id}-${index}`}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="font-medium text-slate-950">
            {medication.name} {medication.dosage}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {medication.frequency}
            {medication.duration ? ` · ${medication.duration}` : ""}
          </p>
          {medication.instructions ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {medication.instructions}
            </p>
          ) : null}
        </div>
      )),
    [prescription.id, prescription.medications]
  )

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{prescription.rxNumber}</DialogTitle>
          <DialogDescription>
            Issued {formatDateTime(prescription.issuedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Status</p>
              <p className="mt-2 text-sm text-slate-600">{prescription.status}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Issued</p>
              <p className="mt-2 text-sm text-slate-600">
                {formatDateTime(prescription.issuedAt)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Expires</p>
              <p className="mt-2 text-sm text-slate-600">
                {prescription.expiresAt ? formatDateTime(prescription.expiresAt) : "Not set"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-950">Medications</h3>
            {medicationSummary.length > 0 ? (
              <div className="space-y-3">{medicationSummary}</div>
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No medication details available.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-900">General Instructions</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {prescription.instructions || "No general instructions provided."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Close
          </Button>
          {showPrint ? (
            <Button onClick={() => window.print()} type="button">
              Print
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
