"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  addMedicationAction,
  updateMedicationAction,
} from "@/actions/ehr"
import { DatePicker } from "@/components/shared/DatePicker"
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
import { FormMessage } from "@/components/ui/form-message"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EHRMedication } from "@/lib/data/ehr"
import {
  medicationRouteSchema,
  medicationSchema,
  type MedicationInput,
} from "@/lib/validations/ehr"

const routeOptions = medicationRouteSchema.options

function formatRouteLabel(route: string) {
  return route.charAt(0).toUpperCase() + route.slice(1)
}

function getDefaultValues(medication?: EHRMedication | null): MedicationInput {
  return {
    dosage: medication?.dosage ?? "",
    end_date: medication?.endDate ?? "",
    frequency: medication?.frequency ?? "",
    name: medication?.name ?? "",
    notes: medication?.notes ?? "",
    reason: medication?.reason ?? "",
    route: (medication?.route as MedicationInput["route"]) ?? "oral",
    start_date: medication?.startDate ?? new Date().toISOString().split("T")[0],
  }
}

type MedicationEditorDialogProps = {
  medication?: EHRMedication | null
  onComplete: () => void
  patientId: string
  triggerLabel: ReactNode
}

export function MedicationEditorDialog({
  medication,
  onComplete,
  patientId,
  triggerLabel,
}: MedicationEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const form = useForm<MedicationInput>({
    defaultValues: getDefaultValues(medication),
    resolver: zodResolver(medicationSchema),
  })

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(medication))
      setFormError(undefined)
    }
  }, [form, medication, open])

  const handleSubmit = (values: MedicationInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = medication
        ? await updateMedicationAction(medication.id, values)
        : await addMedicationAction(patientId, values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof MedicationInput, {
              message: messages[0],
              type: "server",
            })
          }
        })
      }

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      toast.success(medication ? "Medication updated." : "Medication added.")
      setOpen(false)
      onComplete()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger nativeButton={false} render={<div>{triggerLabel}</div>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{medication ? "Edit Medication" : "Add Medication"}</DialogTitle>
          <DialogDescription>
            Record dosage, frequency, route, and treatment notes.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medication-name">Name</Label>
              <Input id="medication-name" {...form.register("name")} />
              <FormMessage message={form.formState.errors.name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medication-dosage">Dosage</Label>
              <Input id="medication-dosage" {...form.register("dosage")} />
              <FormMessage message={form.formState.errors.dosage?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medication-frequency">Frequency</Label>
              <Input id="medication-frequency" {...form.register("frequency")} />
              <FormMessage message={form.formState.errors.frequency?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medication-route">Route</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("route", (value ?? "oral") as MedicationInput["route"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={form.watch("route")}
              >
                <SelectTrigger id="medication-route">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routeOptions.map((route) => (
                    <SelectItem key={route} value={route}>
                      {formatRouteLabel(route)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage message={form.formState.errors.route?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medication-start-date">Start Date</Label>
              <Controller
                control={form.control}
                name="start_date"
                render={({ field, fieldState }) => (
                  <DatePicker
                    onChange={field.onChange}
                    value={field.value}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medication-end-date">End Date</Label>
              <Controller
                control={form.control}
                name="end_date"
                render={({ field, fieldState }) => (
                  <DatePicker
                    allowClear
                    minDate={
                      form.watch("start_date")
                        ? new Date(`${form.watch("start_date")}T00:00:00`)
                        : undefined
                    }
                    onChange={field.onChange}
                    placeholder="Select end date"
                    value={field.value}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medication-reason">Reason</Label>
            <Textarea id="medication-reason" rows={3} {...form.register("reason")} />
            <FormMessage message={form.formState.errors.reason?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medication-notes">Notes</Label>
            <Textarea id="medication-notes" rows={3} {...form.register("notes")} />
            <FormMessage message={form.formState.errors.notes?.message} />
          </div>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="ghost">
              Cancel
            </Button>
            <LoadingButton
              isLoading={isPending}
              loadingText={medication ? "Saving..." : "Adding..."}
              type="submit"
            >
              {medication ? "Save Changes" : "Add Medication"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
