"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, CalendarPlus } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  appointmentSchema,
  type AppointmentInput,
} from "@/lib/validations/appointment"
import type { PatientBookableProvider } from "@/lib/data/app-shell"

type PatientScheduleAppointmentDialogProps = {
  providers: PatientBookableProvider[]
}

const patientAppointmentSchema = appointmentSchema.omit({ patient_id: true }).extend({
  provider_id: z.string().uuid("Select a provider"),
})

type PatientAppointmentInput = Omit<AppointmentInput, "patient_id"> & {
  provider_id: string
}

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

function getDurationOptions(slotDuration: number) {
  return [...new Set([30, 45, 60, slotDuration])]
    .filter((duration) => duration >= 15 && duration <= 120)
    .sort((left, right) => left - right)
}

function formatSpecialty(specialty: string) {
  return specialty
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function formatProviderDisplayLabel(provider: PatientBookableProvider) {
  return `${provider.fullName} (${formatSpecialty(provider.specialty)})`
}

export function PatientScheduleAppointmentDialog({
  providers,
}: PatientScheduleAppointmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isLoadingBookedSlots, setIsLoadingBookedSlots] = useState(false)
  const form = useForm<PatientAppointmentInput>({
    defaultValues: {
      appointment_date: "",
      appointment_time: "",
      duration: providers[0]?.slotDuration ?? 30,
      provider_id: "",
      reason: "",
      type: "video",
    },
    resolver: zodResolver(patientAppointmentSchema),
  })

  const selectedProviderId = useWatch({
    control: form.control,
    name: "provider_id",
  })
  const selectedDate = useWatch({
    control: form.control,
    name: "appointment_date",
  })
  const selectedDuration = useWatch({
    control: form.control,
    name: "duration",
  })
  const selectedTime = useWatch({
    control: form.control,
    name: "appointment_time",
  })

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId) ?? null,
    [providers, selectedProviderId]
  )
  const durationOptions = useMemo(
    () => getDurationOptions(selectedProvider?.slotDuration ?? 30),
    [selectedProvider?.slotDuration]
  )

  const selectedWeekday = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
      })
    : null
  const dayAllowed =
    !selectedWeekday ||
    !selectedProvider ||
    selectedProvider.availableDays.length === 0 ||
    selectedProvider.availableDays.includes(selectedWeekday.toLowerCase())
  const selectedDateTimeValue =
    selectedDate && selectedTime ? `${selectedDate}T${selectedTime}` : selectedDate ?? undefined

  useEffect(() => {
    if (!selectedProvider) {
      return
    }

    const nextDuration = durationOptions.includes(selectedDuration)
      ? selectedDuration
      : selectedProvider.slotDuration

    form.setValue("duration", nextDuration, {
      shouldDirty: false,
      shouldValidate: true,
    })
    form.setValue("appointment_time", "", {
      shouldDirty: false,
      shouldValidate: true,
    })
  }, [durationOptions, form, selectedDuration, selectedProvider])

  useEffect(() => {
    let cancelled = false

    async function loadBookedSlots() {
      if (!open || !selectedDate || !selectedProvider || !dayAllowed) {
        setBookedSlots([])
        return
      }

      setIsLoadingBookedSlots(true)
      const result = await getBookedSlotsAction({
        appointment_date: selectedDate,
        duration: selectedDuration,
        provider_id: selectedProvider.id,
        slot_duration: selectedProvider.slotDuration,
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
  }, [dayAllowed, open, selectedDate, selectedDuration, selectedProvider])

  useEffect(() => {
    if (selectedTime && bookedSlots.includes(selectedTime)) {
      form.setValue("appointment_time", "", {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [bookedSlots, form, selectedTime])

  const onSubmit = (values: PatientAppointmentInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = await createAppointmentAction(values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.[0]) {
            return
          }

          form.setError(field as keyof PatientAppointmentInput, {
            message: messages[0],
            type: "server",
          })
        })
      }

      if (result.error) {
        setFormError(result.error)
        return
      }

      toast.success("Appointment request sent to your provider.")
      setOpen(false)
      form.reset({
        appointment_date: "",
        appointment_time: "",
        duration: providers[0]?.slotDuration ?? 30,
        provider_id: "",
        reason: "",
        type: "video",
      })
      router.refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button disabled={providers.length === 0} />
        }
      >
        <CalendarPlus className="h-4 w-4" />
        Book Appointment
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 sm:max-w-2xl">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Select a provider, choose an open slot, and send your appointment request.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-6 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="provider_id">Provider</Label>
              <Controller
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-10 w-full" id="provider_id">
                      <span
                        className={cn(
                          "flex flex-1 text-left",
                          !selectedProvider && "text-muted-foreground"
                        )}
                      >
                        {selectedProvider
                          ? formatProviderDisplayLabel(selectedProvider)
                          : "Select provider"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {formatProviderDisplayLabel(provider)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {selectedProvider ? (
                <p className="text-xs text-slate-500">
                  Available on{" "}
                  {selectedProvider.availableDays.length > 0
                    ? selectedProvider.availableDays.join(", ")
                    : "all weekdays"}
                  . Standard slot {selectedProvider.slotDuration} minutes.
                </p>
              ) : null}
              <FormMessage message={form.formState.errors.provider_id?.message} />
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
                        if (!selectedProvider) {
                          return true
                        }
                        if (selectedProvider.availableDays.length === 0) {
                          return false
                        }
                        const weekday = date
                          .toLocaleDateString("en-US", { weekday: "long" })
                          .toLowerCase()
                        return !selectedProvider.availableDays.includes(weekday)
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
                      disabled={!selectedProvider}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <SelectTrigger className="h-10 w-full" id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((duration) => (
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

            {!selectedProvider ? (
              <p className="text-xs text-slate-500">Select a provider to view available slots.</p>
            ) : null}
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
                        className={cn(
                          "rounded-2xl border p-4 text-left transition",
                          field.value === option.value
                            ? "border-[var(--teal)] bg-[var(--teal-light)]"
                            : "border-slate-200 bg-white hover:border-[var(--teal)]/40 hover:bg-slate-50"
                        )}
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
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
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

