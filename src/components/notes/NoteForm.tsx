"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
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
  const [formError, setFormError] = useState<string>()
  const form = useForm<NoteFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(noteFormSchema),
  })

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

  return (
    <form className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
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
                  <SelectTrigger className="h-10 w-full" id="patient_id">
                    <SelectValue placeholder="Select patient" />
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
                  <SelectTrigger className="h-10 w-full" id="appointment_id">
                    <SelectValue placeholder="Select appointment" />
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

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Vitals</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            ["bp_systolic", "BP Systolic"],
            ["bp_diastolic", "BP Diastolic"],
            ["heart_rate", "Heart Rate"],
            ["temperature", "Temperature"],
            ["weight", "Weight"],
            ["height", "Height"],
            ["oxygen_sat", "O2 Saturation"],
          ].map(([field, label]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <Input
                disabled={readOnly}
                id={field}
                inputMode="decimal"
                {...form.register(field as keyof NoteFormValues)}
              />
              <FormMessage
                message={form.formState.errors[field as keyof NoteFormValues]?.message as string | undefined}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">SOAP Sections</h2>
        <div className="mt-5 space-y-5">
          {[
            ["subjective", "Subjective", "Chief complaint, symptoms, patient's own words"],
            ["objective", "Objective", "Physical exam findings, test results, observations"],
            ["assessment", "Assessment", "Diagnosis, clinical impression"],
            ["plan", "Plan", "Treatment, prescriptions, follow-up instructions"],
          ].map(([field, label, placeholder]) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{label}</Label>
              <Textarea
                disabled={readOnly}
                id={field}
                placeholder={placeholder}
                rows={field === "objective" ? 4 : 5}
                {...form.register(field as keyof NoteFormValues)}
              />
              <FormMessage
                message={form.formState.errors[field as keyof NoteFormValues]?.message as string | undefined}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Diagnosis Codes</h2>
        <div className="mt-5">
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
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Signed note on {new Date(signedAt).toLocaleString()}.
        </div>
      ) : null}

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
              variant="outline"
            >
              Save as Draft
            </LoadingButton>

            {formError ? (
              <div
                className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:order-last sm:w-auto sm:min-w-[320px]"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            <Dialog>
              <DialogTrigger
                render={
                  <LoadingButton
                    className="w-full bg-sky-500 text-white hover:bg-sky-600 sm:w-auto"
                    isLoading={isSigning}
                    loadingText="Signing..."
                    type="button"
                  />
                }
              >
                Sign Note
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign note?</DialogTitle>
                  <DialogDescription>
                    Signed notes cannot be edited. Proceed?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button type="button" variant="outline" />}>
                    Cancel
                  </DialogClose>
                  <LoadingButton
                    className="bg-sky-500 text-white hover:bg-sky-600"
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
    </form>
  )
}
