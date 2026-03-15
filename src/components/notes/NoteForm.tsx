"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Activity, HeartPulse, Ruler, Scale, Thermometer, Wind } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { saveDraftNoteAction, signNoteAction } from "@/actions/notes"
import { TagsInput } from "@/components/shared/TagsInput"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type NoteFormValues = {
  appointment_id: string
  assessment: string
  bp_diastolic: string
  bp_systolic: string
  diagnosis_codes: string[]
  heart_rate: string
  height: string
  objective: string
  oxygen_sat: string
  patient_id: string
  plan: string
  subjective: string
  temperature: string
  weight: string
}

type NoteFormProps = {
  appointmentOptions: Array<{ id: string; label: string; patientId: string }>
  initialValues: NoteFormValues
  noteId?: string
  patientOptions: Array<{ id: string; patientId: string; patientName: string }>
  readOnly: boolean
  signedAt?: string | null
}

const noteFormSchema = z.object({
  appointment_id: z.string(),
  assessment: z.string().min(5, "Assessment is required"),
  bp_diastolic: z.string(),
  bp_systolic: z.string(),
  diagnosis_codes: z.array(z.string()),
  heart_rate: z.string(),
  height: z.string(),
  objective: z.string(),
  oxygen_sat: z.string(),
  patient_id: z.string().uuid("Patient is required"),
  plan: z.string().min(10, "Plan is required (min 10 characters)"),
  subjective: z.string().min(10, "Subjective notes required (min 10 characters)"),
  temperature: z.string(),
  weight: z.string(),
})

const vitalFields: Array<{ field: keyof NoteFormValues; icon: typeof Activity; label: string; placeholder: string }> = [
  { field: "bp_systolic", icon: HeartPulse, label: "BP Systolic", placeholder: "mmHg" },
  { field: "bp_diastolic", icon: HeartPulse, label: "BP Diastolic", placeholder: "mmHg" },
  { field: "heart_rate", icon: Activity, label: "Heart Rate", placeholder: "bpm" },
  { field: "temperature", icon: Thermometer, label: "Temperature", placeholder: "C" },
  { field: "weight", icon: Scale, label: "Weight", placeholder: "kg" },
  { field: "height", icon: Ruler, label: "Height", placeholder: "cm" },
  { field: "oxygen_sat", icon: Wind, label: "O2 Saturation", placeholder: "%" },
]

const soapSections: Array<{
  field: keyof NoteFormValues
  hint: string
  letter: string
  subtitle: string
  title: string
  tone: string
}> = [
  {
    field: "subjective",
    hint: "Chief complaint, symptoms, patient-reported history",
    letter: "S",
    subtitle: "Subjective",
    title: "Subjective",
    tone: "border-[var(--teal)] bg-[var(--teal-light)] text-[var(--teal-dark)]",
  },
  {
    field: "objective",
    hint: "Physical exam findings, observed signs, measured values",
    letter: "O",
    subtitle: "Objective",
    title: "Objective",
    tone: "border-[#8B5CF6] bg-[#F3E8FF] text-[#7C3AED]",
  },
  {
    field: "assessment",
    hint: "Clinical interpretation and diagnosis",
    letter: "A",
    subtitle: "Assessment",
    title: "Assessment",
    tone: "border-[#F59E0B] bg-[#FFFBEB] text-[#B45309]",
  },
  {
    field: "plan",
    hint: "Treatment plan, medications, follow-up",
    letter: "P",
    subtitle: "Plan",
    title: "Plan",
    tone: "border-[var(--navy)] bg-[#E2E8F0] text-[var(--navy)]",
  },
]

export function NoteForm({
  appointmentOptions,
  initialValues,
  noteId,
  patientOptions,
  readOnly,
  signedAt,
}: NoteFormProps) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [isSigning, startSigning] = useTransition()
  const [isSignConfirmOpen, setIsSignConfirmOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const form = useForm<NoteFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(noteFormSchema),
  })
  const selectedPatientId = form.watch("patient_id")
  const selectedAppointmentId = form.watch("appointment_id")
  const selectedPatient =
    patientOptions.find((patient) => patient.id === selectedPatientId) ?? null
  const selectedAppointment =
    appointmentOptions.find((appointment) => appointment.id === selectedAppointmentId) ?? null

  const applyServerErrors = (fieldErrors?: Record<string, string[] | undefined>) => {
    if (!fieldErrors) {
      return
    }

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (!messages?.[0]) {
        return
      }

      form.setError(field as keyof NoteFormValues, {
        message: messages[0],
        type: "server",
      })
    })
  }

  const handleResult = (
    result: Awaited<ReturnType<typeof saveDraftNoteAction>>,
    successMessage: string
  ) => {
    applyServerErrors(result.fieldErrors)

    if (result.error) {
      setFormError(result.error)
      toast.error(result.error)
      return
    }

    if (result.noteId) {
      toast.success(successMessage)
      router.push(`/notes/${result.noteId}`)
      router.refresh()
    }
  }

  const submitDraft = form.handleSubmit((values) =>
    startSaving(async () => {
      setFormError(undefined)
      const result = await saveDraftNoteAction(noteId, values)
      handleResult(result, "Draft saved.")
    })
  )

  const submitSign = form.handleSubmit((values) =>
    startSigning(async () => {
      setFormError(undefined)
      const result = await signNoteAction(noteId, values)
      handleResult(result, "Note signed.")
    })
  )

  const openSignConfirmIfValid = async () => {
    setFormError(undefined)
    const isValid = await form.trigger(undefined, { shouldFocus: true })
    if (!isValid) {
      return
    }
    setIsSignConfirmOpen(true)
  }

  return (
    <form className="space-y-6 pb-28">
      <section className="rounded-2xl border border-[var(--border)] border-l-4 border-l-[var(--teal)] bg-white p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="patient_id">Patient</Label>
            <Controller
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <Select
                  disabled={readOnly}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="w-full" id="patient_id">
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
                    {patientOptions.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.patientName} ({patient.patientId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormMessage message={form.formState.errors.patient_id?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment_id">Linked Appointment</Label>
            <Controller
              control={form.control}
              name="appointment_id"
              render={({ field }) => (
                <Select
                  disabled={readOnly}
                  onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                  value={field.value || "none"}
                >
                  <SelectTrigger className="w-full" id="appointment_id">
                    <span
                      className={
                        selectedAppointment
                          ? "flex flex-1 text-left"
                          : "flex flex-1 text-left text-muted-foreground"
                      }
                    >
                      {selectedAppointment ? selectedAppointment.label : "Standalone note"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standalone note</SelectItem>
                    {appointmentOptions.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {appointment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-white">
        <div className="bg-[var(--navy)] px-5 py-3.5">
          <h2 className="text-sm font-semibold text-white">Vital Signs</h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {vitalFields.map(({ field, icon: Icon, label, placeholder }) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>
                <span className="inline-flex items-center gap-1.5 text-[var(--teal-dark)]">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              </Label>
              <Input
                disabled={readOnly}
                id={field}
                inputMode="decimal"
                placeholder={placeholder}
                {...form.register(field)}
              />
              <FormMessage
                message={form.formState.errors[field]?.message as string | undefined}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {soapSections.map((section) => (
          <article key={section.field} className={`rounded-[14px] border border-[var(--border)] bg-white p-5`}>
            <div className="mb-4 flex items-start gap-3 border-b border-[#F1F5F9] pb-4">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${section.tone}`}>
                {section.letter}
              </span>
              <div>
                <h3 className="hf-card-title">{section.title}</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{section.hint}</p>
              </div>
            </div>
            <Textarea
              disabled={readOnly}
              id={section.field}
              className="min-h-[120px] resize-y border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
              placeholder={section.subtitle}
              {...form.register(section.field)}
            />
            <FormMessage
              message={form.formState.errors[section.field]?.message as string | undefined}
            />
          </article>
        ))}
      </section>

      <section className="rounded-[14px] border border-[var(--border)] bg-white p-5">
        <h2 className="hf-card-title">Diagnosis Codes</h2>
        <div className="mt-4">
          <Controller
            control={form.control}
            name="diagnosis_codes"
            render={({ field }) => (
              <TagsInput
                onChange={field.onChange}
                placeholder="Add ICD-10 code and press Enter"
                value={field.value ?? []}
              />
            )}
          />
        </div>
      </section>

      {signedAt ? (
        <div className="hf-alert-success">
          Signed note on {new Date(signedAt).toLocaleString()}.
        </div>
      ) : null}

      {formError ? <div className="hf-alert-error">{formError}</div> : null}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-[var(--border)] bg-white px-4 py-4 shadow-[0_-6px_20px_rgba(15,23,42,0.05)] sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link href="/notes">
            <Button className="w-full sm:w-auto" type="button" variant="outline">
              Back to Notes
            </Button>
          </Link>
          {!readOnly ? (
            <>
              <LoadingButton
                className="w-full sm:w-auto"
                isLoading={isSaving}
                loadingText="Saving..."
                onClick={() => void submitDraft()}
                type="button"
                variant="secondary"
              >
                Save as Draft
              </LoadingButton>

              <LoadingButton
                className="w-full sm:w-auto"
                isLoading={isSigning}
                loadingText="Signing..."
                onClick={() => void openSignConfirmIfValid()}
                type="button"
              >
                Sign Note
              </LoadingButton>

              <Dialog onOpenChange={setIsSignConfirmOpen} open={isSignConfirmOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sign note?</DialogTitle>
                    <DialogDescription>
                      Signed notes cannot be edited. Proceed?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose render={<Button type="button" variant="ghost" />}>
                      Cancel
                    </DialogClose>
                    <LoadingButton
                      isLoading={isSigning}
                      loadingText="Signing..."
                      onClick={() => void submitSign()}
                      type="button"
                    >
                      Confirm Sign
                    </LoadingButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : null}
        </div>
      </div>
    </form>
  )
}
