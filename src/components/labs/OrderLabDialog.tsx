"use client"

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Search } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { orderLabAction } from "@/actions/labs"
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
import type { OrderLabPatientOption } from "@/lib/data/labs"
import { cn } from "@/lib/utils"
import {
  labOrderSchema,
  labPrioritySchema,
  labTestTypeSchema,
  type LabOrderInput,
} from "@/lib/validations/lab"

export type LabAppointmentOption = {
  id: string
  label: string
  patientId: string
}

const priorityOptions = labPrioritySchema.options
const testTypeOptions = labTestTypeSchema.options

function getDefaultValues(prefilledPatientId?: string): LabOrderInput {
  return {
    appointment_id: "",
    instructions: "",
    patient_id: prefilledPatientId ?? "",
    priority: "routine",
    test_name: "",
    test_type: "blood",
  }
}

function formatTestTypeLabel(value: string) {
  return value === "ecg"
    ? "ECG"
    : value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
}

function formatPriorityLabel(value: string) {
  return value === "stat" ? "STAT" : value.charAt(0).toUpperCase() + value.slice(1)
}

type OrderLabDialogProps = {
  appointments?: LabAppointmentOption[]
  patients: OrderLabPatientOption[]
  prefilledPatientId?: string
  triggerLabel: ReactNode
}

export function OrderLabDialog({
  appointments = [],
  patients,
  prefilledPatientId,
  triggerLabel,
}: OrderLabDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [patientSearch, setPatientSearch] = useState("")
  const [isPending, startTransition] = useTransition()
  const form = useForm<LabOrderInput>({
    defaultValues: getDefaultValues(prefilledPatientId),
    resolver: zodResolver(labOrderSchema),
  })

  const selectedPatientId = form.watch("patient_id")
  const selectedAppointmentId = form.watch("appointment_id")
  const fixedPatient = prefilledPatientId
    ? patients.find((patient) => patient.id === prefilledPatientId) ?? null
    : null
  const selectedPatient =
    patients.find((patient) => patient.id === selectedPatientId) ?? null
  const visiblePatients = useMemo(() => {
    if (fixedPatient) {
      return fixedPatient ? [fixedPatient] : []
    }

    const query = patientSearch.trim().toLowerCase()
    if (!query) {
      return patients
    }

    return patients.filter(
      (patient) =>
        patient.patientName.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query)
    )
  }, [fixedPatient, patientSearch, patients])
  const appointmentOptions = useMemo(() => {
    const patientId = prefilledPatientId ?? selectedPatientId

    if (!patientId) {
      return []
    }

    return appointments.filter((appointment) => appointment.patientId === patientId)
  }, [appointments, prefilledPatientId, selectedPatientId])
  const selectedAppointment =
    appointmentOptions.find((appointment) => appointment.id === selectedAppointmentId) ?? null

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset(getDefaultValues(prefilledPatientId))
    setFormError(undefined)
    setPatientSearch("")
  }, [form, open, prefilledPatientId])

  const onSubmit = (values: LabOrderInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = await orderLabAction(values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof LabOrderInput, {
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

      toast.success(`Lab order ${result.orderNumber ?? ""} created.`.trim())
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger nativeButton={false} render={<div>{triggerLabel}</div>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order New Lab</DialogTitle>
          <DialogDescription>
            Create a lab request for this patient and optionally link it to a visit.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          {fixedPatient ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Patient</p>
              <p className="mt-2 text-sm text-slate-600">
                {fixedPatient.patientName} ({fixedPatient.patientId})
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lab-patient-search">Search patient</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="lab-patient-search"
                    className="pl-9"
                    onChange={(event) => setPatientSearch(event.target.value)}
                    placeholder="Search by name or patient ID"
                    value={patientSearch}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lab-patient">Patient</Label>
                <Select
                  onValueChange={(value) => {
                    form.setValue("patient_id", value ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                    form.setValue("appointment_id", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  value={form.watch("patient_id")}
                >
                  <SelectTrigger id="lab-patient">
                    <span
                      className={
                        selectedPatient
                          ? "flex flex-1 text-left"
                          : "flex flex-1 text-left text-muted-foreground"
                      }
                    >
                      {selectedPatient
                        ? `${selectedPatient.patientName} (${selectedPatient.patientId})`
                        : "Select patient"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {visiblePatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.patientName} ({patient.patientId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage message={form.formState.errors.patient_id?.message} />
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lab-test-name">Test Name</Label>
              <Input id="lab-test-name" {...form.register("test_name")} />
              <FormMessage message={form.formState.errors.test_name?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lab-test-type">Test Type</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("test_type", (value ?? "blood") as LabOrderInput["test_type"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={form.watch("test_type")}
              >
                <SelectTrigger id="lab-test-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {testTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatTestTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage message={form.formState.errors.test_type?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {priorityOptions.map((priority) => {
                const active = form.watch("priority") === priority

                return (
                  <button
                    key={priority}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                      active
                        ? "border-[var(--teal)] bg-[var(--teal-light)] text-[var(--teal-dark)]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[var(--teal)]/40 hover:bg-slate-50"
                    )}
                    onClick={() =>
                      form.setValue("priority", priority, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    type="button"
                  >
                    {formatPriorityLabel(priority)}
                  </button>
                )
              })}
            </div>
            <FormMessage message={form.formState.errors.priority?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-appointment">Link to Appointment</Label>
            <Select
              onValueChange={(value) =>
                form.setValue("appointment_id", !value || value === "__none__" ? "" : value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              value={form.watch("appointment_id") || "__none__"}
            >
              <SelectTrigger id="lab-appointment">
                <span
                  className={
                    selectedAppointment
                      ? "flex flex-1 text-left"
                      : "flex flex-1 text-left text-muted-foreground"
                  }
                >
                  {selectedAppointment
                    ? selectedAppointment.label
                    : "No appointment linked"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No appointment linked</SelectItem>
                {appointmentOptions.map((appointment) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    {appointment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage message={form.formState.errors.appointment_id?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lab-instructions">Special Instructions</Label>
            <Textarea
              id="lab-instructions"
              rows={4}
              {...form.register("instructions")}
            />
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
              disabled={patients.length === 0}
              isLoading={isPending}
              loadingText="Ordering..."
              type="submit"
            >
              Order Lab
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
