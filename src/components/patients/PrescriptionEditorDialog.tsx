"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

import { issuePrescriptionAction } from "@/actions/ehr"
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
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { EHRAppointmentOption } from "@/lib/data/ehr"
import {
  prescriptionSchema,
  type PrescriptionInput,
} from "@/lib/validations/ehr"
import { cn } from "@/lib/utils"

function getDefaultValues(): PrescriptionInput {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)

  return {
    appointment_id: "",
    expires_at: expiry.toISOString().split("T")[0],
    instructions: "",
    medications: [
      {
        dosage: "",
        duration: "",
        frequency: "",
        instructions: "",
        name: "",
      },
    ],
  }
}

type PrescriptionEditorDialogProps = {
  appointments: EHRAppointmentOption[]
  onComplete: () => void
  patientId: string
  patientName: string
  triggerLabel: ReactNode
}

export function PrescriptionEditorDialog({
  appointments,
  onComplete,
  patientId,
  patientName,
  triggerLabel,
}: PrescriptionEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const form = useForm<PrescriptionInput>({
    defaultValues: getDefaultValues(),
    resolver: zodResolver(prescriptionSchema),
  })
  const fieldArray = useFieldArray({
    control: form.control,
    name: "medications",
  })
  const selectedAppointmentId = form.watch("appointment_id")
  const selectedAppointmentLabel =
    !selectedAppointmentId
      ? "No appointment linked"
      : appointments.find((appointment) => appointment.id === selectedAppointmentId)?.label ??
        "No appointment linked"

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues())
      setFormError(undefined)
    }
  }, [form, open])

  const handleSubmit = (values: PrescriptionInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = await issuePrescriptionAction(patientId, values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof PrescriptionInput, {
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

      toast.success("Prescription issued.")
      setOpen(false)
      onComplete()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger nativeButton={false} render={<div>{triggerLabel}</div>} />
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Issue Prescription</DialogTitle>
          <DialogDescription>
            Create a prescription for {patientName} with one or more medicines.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Patient</p>
            <p className="mt-2 text-sm text-slate-600">{patientName}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rx-appointment">Link to Appointment</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue(
                    "appointment_id",
                    value && value !== "__none__" ? value : "",
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }
                value={form.watch("appointment_id") || "__none__"}
              >
                <SelectTrigger id="rx-appointment">
                  <span
                    className={cn(
                      "flex flex-1 text-left",
                      !selectedAppointmentLabel && "text-muted-foreground"
                    )}
                  >
                    {selectedAppointmentLabel || "Optional appointment"}
                  </span>
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[22rem]">
                  <SelectItem label="No appointment linked" value="__none__">
                    No appointment linked
                  </SelectItem>
                  {appointments.map((appointment) => (
                    <SelectItem
                      key={appointment.id}
                      label={appointment.label}
                      value={appointment.id}
                    >
                      {appointment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage message={form.formState.errors.appointment_id?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rx-expires">Expires</Label>
              <Controller
                control={form.control}
                name="expires_at"
                render={({ field, fieldState }) => (
                  <DatePicker
                    minDate={new Date()}
                    onChange={field.onChange}
                    value={field.value}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-950">Medications</h3>
              <Button
                onClick={() =>
                  fieldArray.append({
                    dosage: "",
                    duration: "",
                    frequency: "",
                    instructions: "",
                    name: "",
                  })
                }
                type="button"
                variant="outline"
              >
                Add Medicine
              </Button>
            </div>

            <div className="space-y-4">
              {fieldArray.fields.map((field, index) => (
                <div key={field.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input {...form.register(`medications.${index}.name`)} />
                      <FormMessage
                        message={form.formState.errors.medications?.[index]?.name?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dosage</Label>
                      <Input {...form.register(`medications.${index}.dosage`)} />
                      <FormMessage
                        message={form.formState.errors.medications?.[index]?.dosage?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Input {...form.register(`medications.${index}.frequency`)} />
                      <FormMessage
                        message={form.formState.errors.medications?.[index]?.frequency?.message}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input {...form.register(`medications.${index}.duration`)} />
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="w-full"
                        disabled={fieldArray.fields.length === 1}
                        onClick={() => fieldArray.remove(index)}
                        type="button"
                        variant="outline"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Instructions</Label>
                    <Textarea
                      rows={2}
                      {...form.register(`medications.${index}.instructions`)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <FormMessage message={form.formState.errors.medications?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rx-instructions">General Instructions</Label>
            <Textarea id="rx-instructions" rows={4} {...form.register("instructions")} />
            <FormMessage message={form.formState.errors.instructions?.message} />
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
              loadingText="Issuing..."
              type="submit"
            >
              Issue Prescription
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
