"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus } from "lucide-react"
import { toast } from "sonner"

import { stopMedicationAction } from "@/actions/ehr"
import { AllergiesConditionsEditor } from "@/components/patients/AllergiesConditionsEditor"
import { HistoryEditorDialog } from "@/components/patients/HistoryEditorDialog"
import { MedicationEditorDialog } from "@/components/patients/MedicationEditorDialog"
import { PrescriptionEditorDialog } from "@/components/patients/PrescriptionEditorDialog"
import { PrescriptionPreviewDialog } from "@/components/patients/PrescriptionPreviewDialog"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { ProviderPatientEHRData } from "@/lib/data/ehr"
import { formatDate, formatDateTime } from "@/lib/utils"

function formatRouteLabel(route: string | null) {
  if (!route) {
    return "Route not set"
  }

  return route.charAt(0).toUpperCase() + route.slice(1)
}

function formatHistoryType(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function PatientEHRWorkspace({
  patientId,
  patientName,
  activeMedications,
  pastMedications,
  history,
  prescriptions,
  allergies,
  chronicConditions,
  appointments,
}: ProviderPatientEHRData) {
  const router = useRouter()
  const [stopTarget, setStopTarget] = useState<(typeof activeMedications)[number] | null>(null)
  const [isPending, startTransition] = useTransition()

  const refreshData = () => {
    router.refresh()
  }

  const handleStopMedication = () => {
    if (!stopTarget) {
      return
    }

    startTransition(async () => {
      const result = await stopMedicationAction(stopTarget.id)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(`${stopTarget.name} marked as stopped.`)
      setStopTarget(null)
      refreshData()
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-sky-600">Electronic health record</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          EHR for {patientName}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Maintain medications, medical history, prescriptions, and patient health
          flags from one place.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Tabs defaultValue="medications">
          <TabsList variant="line">
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="allergies">Allergies & Conditions</TabsTrigger>
          </TabsList>

          <TabsContent className="pt-6" value="medications">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Current Medications</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Active treatments, dosage, route, and treatment reasons.
                  </p>
                </div>
                <MedicationEditorDialog
                  onComplete={refreshData}
                  patientId={patientId}
                  triggerLabel={
                    <Button className="bg-sky-500 text-white hover:bg-sky-600">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  }
                />
              </div>

              {activeMedications.length === 0 ? (
                <EmptyState
                  description="Add the patient’s current medications to begin the record."
                  title="No active medications"
                />
              ) : (
                <div className="space-y-3">
                  {activeMedications.map((medication) => (
                    <article
                      key={medication.id}
                      className="rounded-3xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">
                              {medication.name} {medication.dosage}
                            </h3>
                            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              {formatRouteLabel(medication.route)}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">
                            {medication.frequency} • {formatRouteLabel(medication.route)} • Since{" "}
                            {formatDate(medication.startDate)}
                          </p>
                          {medication.reason ? (
                            <p className="text-sm text-slate-600">
                              Reason: {medication.reason}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <MedicationEditorDialog
                            medication={medication}
                            onComplete={refreshData}
                            patientId={patientId}
                            triggerLabel={
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            }
                          />
                          <Button
                            className="text-rose-600 hover:bg-rose-50"
                            onClick={() => setStopTarget(medication)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Stop
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <details className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-lg font-semibold text-slate-950">
                  <span>Past Medications</span>
                  <ChevronDown className="h-4 w-4" />
                </summary>
                <div className="mt-4 space-y-3">
                  {pastMedications.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                      No past medications recorded.
                    </p>
                  ) : (
                    pastMedications.map((medication) => (
                      <article
                        key={medication.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-950">
                              {medication.name} {medication.dosage}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {medication.frequency} • {formatRouteLabel(medication.route)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatDate(medication.startDate)} to{" "}
                              {medication.endDate ? formatDate(medication.endDate) : "Present"}
                            </p>
                          </div>
                          <MedicationEditorDialog
                            medication={medication}
                            onComplete={refreshData}
                            patientId={patientId}
                            triggerLabel={
                              <Button size="sm" variant="outline">
                                Edit
                              </Button>
                            }
                          />
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </details>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="history">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Medical History</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Surgeries, family history, allergies, and significant events.
                  </p>
                </div>
                <HistoryEditorDialog
                  onComplete={refreshData}
                  patientId={patientId}
                  triggerLabel={
                    <Button className="bg-sky-500 text-white hover:bg-sky-600">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  }
                />
              </div>

              {history.length === 0 ? (
                <EmptyState
                  description="History records will appear here once added."
                  title="No medical history yet"
                />
              ) : (
                <div className="space-y-3">
                  {history.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-3xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                              {formatHistoryType(record.historyType)}
                            </Badge>
                            {record.isResolved ? (
                              <StatusBadge label="Resolved" tone="confirmed" value="resolved" />
                            ) : null}
                          </div>
                          <h3 className="text-lg font-semibold text-slate-950">
                            {record.title}
                          </h3>
                          {record.description ? (
                            <p className="text-sm leading-6 text-slate-600">
                              {record.description}
                            </p>
                          ) : null}
                          <p className="text-sm text-slate-500">
                            {record.dateOccurred
                              ? formatDate(record.dateOccurred)
                              : formatDate(record.createdAt)}
                          </p>
                        </div>
                        <HistoryEditorDialog
                          onComplete={refreshData}
                          patientId={patientId}
                          record={record}
                          triggerLabel={
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          }
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="prescriptions">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Prescriptions</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Formal prescriptions linked to medications and appointments.
                  </p>
                </div>
                <PrescriptionEditorDialog
                  appointments={appointments}
                  onComplete={refreshData}
                  patientId={patientId}
                  patientName={patientName}
                  triggerLabel={
                    <Button className="bg-sky-500 text-white hover:bg-sky-600">
                      <Plus className="h-4 w-4" />
                      New Rx
                    </Button>
                  }
                />
              </div>

              {prescriptions.length === 0 ? (
                <EmptyState
                  description="Issued prescriptions will appear here."
                  title="No prescriptions yet"
                />
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <article
                      key={prescription.id}
                      className="rounded-3xl border border-slate-200 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">
                              {prescription.rxNumber}
                            </h3>
                            <StatusBadge value={prescription.status} />
                          </div>
                          <p className="text-sm text-slate-600">
                            {formatDate(prescription.issuedAt)}
                          </p>
                          <div className="space-y-1 text-sm text-slate-600">
                            {prescription.medications.map((item, index) => (
                              <p key={`${prescription.id}-${index}`}>
                                {item.name} {item.dosage} {item.frequency}
                                {item.duration ? ` x ${item.duration}` : ""}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <PrescriptionPreviewDialog prescription={prescription} />
                          <PrescriptionPreviewDialog
                            prescription={prescription}
                            showPrint
                            triggerLabel="Print"
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="allergies">
            <AllergiesConditionsEditor
              allergies={allergies}
              chronicConditions={chronicConditions}
              onComplete={refreshData}
              patientId={patientId}
            />
          </TabsContent>
        </Tabs>
      </section>

      <Dialog onOpenChange={(open) => !open && setStopTarget(null)} open={Boolean(stopTarget)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark medication as stopped?</DialogTitle>
            <DialogDescription>
              {stopTarget
                ? `Mark ${stopTarget.name} as stopped?`
                : "Mark this medication as stopped?"}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            This will set the medication inactive and use today as the end date.
          </div>
          <DialogFooter>
            <Button onClick={() => setStopTarget(null)} type="button" variant="outline">
              Cancel
            </Button>
            <LoadingButton
              className="bg-rose-600 text-white hover:bg-rose-700"
              isLoading={isPending}
              loadingText="Stopping..."
              onClick={handleStopMedication}
              type="button"
            >
              Mark as Stopped
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
