"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, X } from "lucide-react"
import { toast } from "sonner"

import {
  confirmAppointmentByPatientAction,
  declineAppointmentByPatientAction,
} from "@/actions/appointments"
import { LoadingButton } from "@/components/shared/LoadingButton"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PortalAppointment } from "@/lib/data/app-shell"
import { formatDateTime } from "@/lib/utils"

type PatientPendingConfirmationSectionProps = {
  appointments: PortalAppointment[]
}

export function PatientPendingConfirmationSection({
  appointments,
}: PatientPendingConfirmationSectionProps) {
  const router = useRouter()
  const [activeDeclineId, setActiveDeclineId] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [formError, setFormError] = useState<string>()
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (appointments.length === 0) {
    return null
  }

  const handleConfirm = (appointmentId: string) => {
    setFormError(undefined)
    setPendingAction(`confirm:${appointmentId}`)

    startTransition(async () => {
      const result = await confirmAppointmentByPatientAction(appointmentId)

      if (result.error) {
        setFormError(result.error)
        setPendingAction(null)
        return
      }

      toast.success("Appointment confirmed.")
      setPendingAction(null)
      router.refresh()
    })
  }

  const handleDecline = () => {
    if (!activeDeclineId) {
      return
    }

    setFormError(undefined)
    setPendingAction(`decline:${activeDeclineId}`)

    startTransition(async () => {
      const result = await declineAppointmentByPatientAction({
        appointment_id: activeDeclineId,
        reason: declineReason,
      })

      if (result.error) {
        setFormError(result.error)
        setPendingAction(null)
        return
      }

      toast.success("Appointment declined.")
      setActiveDeclineId(null)
      setDeclineReason("")
      setPendingAction(null)
      router.refresh()
    })
  }

  return (
    <section className="rounded-[28px] border border-amber-200 bg-amber-50/70 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-slate-950">Pending Confirmation</h2>
        <Badge className="rounded-full border border-amber-200 bg-white text-amber-700">
          Awaiting Confirmation ({appointments.length})
        </Badge>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Review the appointments your provider scheduled for you and confirm or decline
        them from here.
      </p>

      {formError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {appointment.providerName}
                  </h3>
                  <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                    {appointment.providerSpecialty}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {formatDateTime(appointment.scheduledAt)} · {appointment.type.replace("_", " ")}{" "}
                  · {appointment.duration} min
                </p>
                <p className="text-sm text-slate-600">
                  Reason: "{appointment.reason || "Consultation"}"
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <LoadingButton
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  isLoading={isPending && pendingAction === `confirm:${appointment.id}`}
                  loadingText="Confirming..."
                  onClick={() => handleConfirm(appointment.id)}
                  type="button"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </LoadingButton>
                <Button
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setFormError(undefined)
                    setDeclineReason("")
                    setActiveDeclineId(appointment.id)
                  }}
                  type="button"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setActiveDeclineId(null)
            setDeclineReason("")
            setFormError(undefined)
          }
        }}
        open={Boolean(activeDeclineId)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Decline appointment?</DialogTitle>
            <DialogDescription>
              Reason for declining (optional): let your provider know why this slot
              does not work for you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="decline-reason">Reason for declining (optional)</Label>
            <Textarea
              id="decline-reason"
              onChange={(event) => setDeclineReason(event.target.value)}
              rows={4}
              value={declineReason}
            />
          </div>
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => {
                setActiveDeclineId(null)
                setDeclineReason("")
                setFormError(undefined)
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <LoadingButton
              className="bg-rose-600 text-white hover:bg-rose-700"
              isLoading={Boolean(activeDeclineId) && isPending}
              loadingText="Declining..."
              onClick={handleDecline}
              type="button"
            >
              Confirm Decline
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
