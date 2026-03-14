"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { cancelAppointmentAction } from "@/actions/appointments"
import { LoadingButton } from "@/components/shared/LoadingButton"
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

type CancelAppointmentButtonProps = {
  appointmentId: string
}

export function CancelAppointmentButton({
  appointmentId,
}: CancelAppointmentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={<Button className="text-rose-600" size="sm" variant="outline" />}
      >
        Cancel
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel appointment?</DialogTitle>
          <DialogDescription>
            This marks the appointment as cancelled for both provider and patient views.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Keep appointment
          </Button>
          <LoadingButton
            className="bg-rose-600 text-white hover:bg-rose-700"
            isLoading={isPending}
            loadingText="Cancelling..."
            onClick={() =>
              startTransition(async () => {
                const result = await cancelAppointmentAction({
                  appointment_id: appointmentId,
                })

                if (result.error) {
                  toast.error(result.error)
                  return
                }

                toast.success("Appointment cancelled.")
                setOpen(false)
                router.refresh()
              })
            }
            type="button"
          >
            Cancel appointment
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
