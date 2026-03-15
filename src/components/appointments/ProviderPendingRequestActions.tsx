"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import {
  confirmAppointmentByProviderAction,
  declineAppointmentByProviderAction,
} from "@/actions/appointments"
import { LoadingButton } from "@/components/shared/LoadingButton"
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

type ProviderPendingRequestActionsProps = {
  appointmentId: string
}

export function ProviderPendingRequestActions({
  appointmentId,
}: ProviderPendingRequestActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [formError, setFormError] = useState<string>()
  const [pendingAction, setPendingAction] = useState<"confirm" | "decline" | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    setFormError(undefined)
    setPendingAction("confirm")

    startTransition(async () => {
      const result = await confirmAppointmentByProviderAction(appointmentId)

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        setPendingAction(null)
        return
      }

      toast.success("Appointment confirmed.")
      setPendingAction(null)
      router.refresh()
    })
  }

  const handleDecline = () => {
    setFormError(undefined)
    setPendingAction("decline")

    startTransition(async () => {
      const result = await declineAppointmentByProviderAction({
        appointment_id: appointmentId,
        reason,
      })

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        setPendingAction(null)
        return
      }

      toast.success("Appointment request declined.")
      setPendingAction(null)
      setReason("")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <LoadingButton
          isLoading={isPending && pendingAction === "confirm"}
          loadingText="Approving..."
          onClick={handleConfirm}
          type="button"
        >
          Approve
        </LoadingButton>
        <Button
          onClick={() => {
            setFormError(undefined)
            setReason("")
            setOpen(true)
          }}
          type="button"
          variant="destructive"
        >
          Decline
        </Button>
      </div>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Decline appointment request?</DialogTitle>
            <DialogDescription>
              Add an optional reason so the patient understands why this request cannot
              be accepted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="provider-decline-reason">Reason (optional)</Label>
            <Textarea
              id="provider-decline-reason"
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              value={reason}
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
                setOpen(false)
                setReason("")
                setFormError(undefined)
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <LoadingButton
              isLoading={isPending && pendingAction === "decline"}
              loadingText="Declining..."
              onClick={handleDecline}
              type="button"
              variant="destructive"
            >
              Confirm Decline
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
