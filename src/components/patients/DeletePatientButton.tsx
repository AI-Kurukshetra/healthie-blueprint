"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, type ReactElement } from "react"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { deletePatientAction } from "@/actions/patients"
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

type DeletePatientButtonProps = {
  patientId: string
  triggerLabel?: ReactElement
}

export function DeletePatientButton({ patientId, triggerLabel }: DeletePatientButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dialogError, setDialogError] = useState<string>()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setDialogError(undefined)
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          triggerLabel ?? (
            <Button variant="destructive">
              Delete
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete patient?</DialogTitle>
          <DialogDescription>
            {dialogError
              ? "This patient cannot be deleted until all active appointments are cancelled."
              : "This removes the patient profile, auth account, and related records that depend on it."}
          </DialogDescription>
        </DialogHeader>
        {dialogError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{dialogError}</span>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)} type="button" variant="ghost">
            Cancel
          </Button>
          <LoadingButton
            variant="destructive"
            isLoading={isPending}
            loadingText="Deleting..."
            onClick={() => {
              setDialogError(undefined)
              startTransition(async () => {
                const result = await deletePatientAction(patientId)

                if (result.error) {
                  setDialogError(result.error)
                  return
                }

                toast.success("Patient deleted.")
                handleOpenChange(false)
                router.push("/patients")
                router.refresh()
              })
            }}
            type="button"
          >
            Delete patient
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
