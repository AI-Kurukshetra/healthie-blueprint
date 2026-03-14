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

function buildTimeSlots(slotDuration: number) {
  const slots: string[] = []

  for (let hour = 9; hour < 17; hour += 1) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      if (hour === 16 && minute > 0) {
        continue
      }

      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      )
    }
  }

  return slots
}

function formatSlot(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const suffix = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 === 0 ? 12 : hours % 12

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`
}

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
  const selectedTime = useWatch({
    control: form.control,
    name: "appointment_time",
  })

  const filteredPatients = patients.filter((patient) => {
    if (!patientSearch.trim()) {
      return true
    }

    const search = patientSearch.toLowerCase()
    return (
      patient.fullName.toLowerCase().includes(search) ||
      patient.patientId.toLowerCase().includes(search)
    )
  })

  const availableSlots = buildTimeSlots(slotDuration).filter((time) => {
    if (!selectedDate) {
      return true
    }

    const candidate = new Date(`${selectedDate}T${time}:00`)
    return candidate > new Date()
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
      <DialogTrigger
        render={<Button className="h-11 rounded-xl bg-sky-500 px-4 text-white hover:bg-sky-600" />}
      >
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
                  placeholder="Search patient by name or ID"
                  value={patientSearch}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="patient_id">Patient</Label>
              <Controller
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-10 w-full" id="patient_id">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName} ({patient.patientId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMessage message={form.formState.errors.patient_id?.message} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment_date">Date</Label>
                <Input
                  id="appointment_date"
                  min={new Date().toISOString().split("T")[0]}
                  type="date"
                  {...form.register("appointment_date")}
                />
                {!dayAllowed ? (
                  <FormMessage message="Selected day is outside provider availability." />
                ) : null}
                <FormMessage message={form.formState.errors.appointment_date?.message} />
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

            <div className="space-y-2">
              <Label>Time</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableSlots.map((slot) => (
                  (() => {
                    const isBooked = bookedSlots.includes(slot)
                    const isSelected = selectedTime === slot

                    return (
                      <button
                        key={slot}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                          isBooked
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : isSelected
                              ? "border-sky-500 bg-sky-50 text-sky-700"
                              : "border-slate-200 bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white"
                        }`}
                        disabled={isBooked}
                        onClick={() =>
                          form.setValue("appointment_time", slot, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        title={isBooked ? "Already booked" : undefined}
                        type="button"
                      >
                        {formatSlot(slot)}
                      </button>
                    )
                  })()
                ))}
              </div>
              {isLoadingBookedSlots ? (
                <p className="text-xs text-slate-500">Checking slot availability...</p>
              ) : null}
              <FormMessage message={form.formState.errors.appointment_time?.message} />
            </div>

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
                            ? "border-sky-500 bg-sky-50"
                            : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
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
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <LoadingButton
                className="bg-sky-500 text-white hover:bg-sky-600"
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
