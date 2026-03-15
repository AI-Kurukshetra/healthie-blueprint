"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarPlus, Search } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  createAppointmentAction,
  getBookedSlotsAction,
} from "@/actions/appointments"
import { DateTimePicker } from "@/components/shared/DateTimePicker"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { ProviderPatientListItem } from "@/lib/data/provider"
import {
  appointmentSchema,
  type AppointmentInput,
} from "@/lib/validations/appointment"

type ScheduleAppointmentDialogProps = {
  patients: ProviderPatientListItem[]
  providerAvailability: string[]
  slotDuration: number
}

const durations = [30, 45, 60]
const appointmentTypes = [
  {
    description: "Virtual consultation with a video room.",
    label: "Video",
    value: "video",
  },
  {
    description: "Patient visits the clinic or office.",
    label: "In-Person",
    value: "in_person",
  },
  {
    description: "Audio-only call without video.",
    label: "Phone",
    value: "phone",
  },
] as const

export function ScheduleAppointmentDialog({
  patients,
  providerAvailability,
  slotDuration,
}: ScheduleAppointmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [patientSearch, setPatientSearch] = useState("")
  const [formError, setFormError] = useState<string>()
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false)
  const form = useForm<AppointmentInput>({
    defaultValues: {
      appointment_date: "",
      appointment_time: "",
      duration: slotDuration,
      patient_id: "",
      reason: "",
      type: "video",
    },
    resolver: zodResolver(appointmentSchema),
  })

  const selectedDate = useWatch({
    control: form.control,
    name: "appointment_date",
  })
  const selectedPatientId = useWatch({
    control: form.control,
    name: "patient_id",
  })
  const selectedDuration = useWatch({
    control: form.control,
    name: "duration",
  })
  const selectedTime = useWatch({ control: form.control, name: "appointment_time" })
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null
  const normalizedPatientSearch = patientSearch.trim().toLowerCase()

  const filteredPatients = patients.filter((patient) => {
    if (!normalizedPatientSearch) {
      return true
    }

    return (
      patient.fullName.toLowerCase().includes(normalizedPatientSearch) ||
      patient.patientId.toLowerCase().includes(normalizedPatientSearch) ||
      patient.email.toLowerCase().includes(normalizedPatientSearch)
    )
  })

  const selectedWeekday = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
      })
    : null
  const dayAllowed =
    !selectedWeekday ||
    providerAvailability.length === 0 ||
    providerAvailability.includes(selectedWeekday.toLowerCase())
  const selectedDateTimeValue =
    selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : selectedDate ?? undefined

  useEffect(() => {
    let cancelled = false

    async function loadBookedSlots() {
      if (!open || !selectedDate || !dayAllowed) {
        setBookedSlots([])
        return
      }

      setIsLoadingBookedSlots(true)
      const result = await getBookedSlotsAction({
        appointment_date: selectedDate,
        duration: selectedDuration,
        patient_id: selectedPatientId || undefined,
        slot_duration: slotDuration,
      })

      if (cancelled) {
        return
      }

      setBookedSlots(result.bookedSlots ?? [])
      setIsLoadingBookedSlots(false)
    }

    void loadBookedSlots()

    return () => {
      cancelled = true
    }
  }, [dayAllowed, open, selectedDate, selectedDuration, selectedPatientId, slotDuration])

  useEffect(() => {
    if (selectedTime && bookedSlots.includes(selectedTime)) {
      form.setValue("appointment_time", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [bookedSlots, form, selectedTime])

  const onSubmit = (values: AppointmentInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = await createAppointmentAction(values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.[0]) {
            return
          }

          form.setError(field as keyof AppointmentInput, {
            message: messages[0],
            type: "server",
          })
        })
      }

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      toast.success("Appointment scheduled. Patient has been notified.")
      setOpen(false)
      form.reset({
        appointment_date: "",
        appointment_time: "",
        duration: slotDuration,
        patient_id: "",
        reason: "",
        type: "video",
      })
      router.refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button />}>
        <CalendarPlus className="h-4 w-4" />
        Schedule Appointment
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 sm:max-w-2xl">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Choose a patient, select a valid slot, and confirm the consultation type.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-6 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="patient-search">Patient search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-9"
                  id="patient-search"
                  onChange={(event) => setPatientSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      if (filteredPatients.length === 1) {
                        form.setValue("patient_id", filteredPatients[0].id, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    }
                  }}
                  placeholder="Search patient by name, ID, or email"
                  value={patientSearch}
                />
              </div>
              <p className="text-xs text-slate-500">
                {normalizedPatientSearch
                  ? `${filteredPatients.length} match${filteredPatients.length === 1 ? "" : "es"} in Patient dropdown`
                  : `Showing all ${patients.length} patients in Patient dropdown`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient</Label>
              <Controller
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-10 w-full" id="patient_id">
                      <span
                        className={
                          selectedPatient
                            ? "flex flex-1 text-left"
                            : "flex flex-1 text-left text-muted-foreground"
                        }
                      >
                        {selectedPatient
                          ? `${selectedPatient.fullName} (${selectedPatient.patientId})`
                          : "Select patient"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          No patients match your search.
                        </div>
                      ) : (
                        filteredPatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.fullName} ({patient.patientId})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMessage message={form.formState.errors.patient_id?.message} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Controller
                  control={form.control}
                  name="appointment_date"
                  render={({ fieldState }) => (
                    <DateTimePicker
                      bookedSlots={bookedSlots}
                      disabled={(date) => {
                        if (providerAvailability.length === 0) {
                          return false
                        }
                        const weekday = date
                          .toLocaleDateString("en-US", { weekday: "long" })
                          .toLowerCase()
                        return !providerAvailability.includes(weekday)
                      }}
                      label="Appointment Date & Time"
                      minDate={new Date()}
                      onChange={(dateTime) => {
                        const [date, time] = dateTime.split("T")
                        form.setValue("appointment_date", date, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                        form.setValue("appointment_time", time ?? "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                      onDateChange={(date) => {
                        form.setValue("appointment_date", date, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                        form.setValue("appointment_time", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }}
                      value={selectedDateTimeValue}
                      error={
                        fieldState.error?.message ??
                        form.formState.errors.appointment_time?.message
                      }
                    />
                  )}
                />
                {!dayAllowed ? <FormMessage message="Selected day is outside provider availability." /> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Controller
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <SelectTrigger className="h-10 w-full" id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((duration) => (
                          <SelectItem key={duration} value={String(duration)}>
                            {duration} minutes
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormMessage message={form.formState.errors.duration?.message} />
              </div>
            </div>

            {isLoadingBookedSlots ? (
              <p className="text-xs text-slate-500">Checking slot availability...</p>
            ) : null}

            <div className="space-y-2">
              <Label>Type</Label>
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <div className="grid gap-3 md:grid-cols-3">
                    {appointmentTypes.map((option) => (
                      <button
                        key={option.value}
                        className={`rounded-2xl border p-4 text-left transition ${
                          field.value === option.value
                            ? "border-[var(--teal)] bg-[var(--teal-light)]"
                            : "border-slate-200 bg-white hover:border-[var(--teal)]/40 hover:bg-slate-50"
                        }`}
                        onClick={() => field.onChange(option.value)}
                        type="button"
                      >
                        <p className="font-medium text-slate-950">{option.label}</p>
                        <p className="mt-1 text-sm text-slate-600">{option.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              />
              <FormMessage message={form.formState.errors.type?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" rows={4} {...form.register("reason")} />
              <FormMessage message={form.formState.errors.reason?.message} />
            </div>

            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                ⚠️ {formError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button onClick={() => setOpen(false)} type="button" variant="ghost">
                Cancel
              </Button>
              <LoadingButton
                isLoading={isPending}
                loadingText="Booking..."
                type="submit"
              >
                Book Appointment
              </LoadingButton>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
