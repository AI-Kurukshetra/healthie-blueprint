"use client"

import { useEffect, useState, useTransition, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  addMedicalHistoryAction,
  updateMedicalHistoryAction,
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
import type { EHRMedicalHistoryRecord } from "@/lib/data/ehr"
import {
  medicalHistorySchema,
  type MedicalHistoryInput,
} from "@/lib/validations/ehr"

const historyTypeOptions = [
  { label: "Past Condition", value: "past_condition" },
  { label: "Surgery", value: "surgery" },
  { label: "Family History", value: "family_history" },
  { label: "Vaccination", value: "vaccination" },
  { label: "Allergy", value: "allergy" },
  { label: "Hospitalization", value: "hospitalization" },
] as const

function getDefaultValues(record?: EHRMedicalHistoryRecord | null): MedicalHistoryInput {
  return {
    date_occurred: record?.dateOccurred ?? "",
    description: record?.description ?? "",
    history_type: (record?.historyType as MedicalHistoryInput["history_type"]) ?? "past_condition",
    is_resolved: record?.isResolved ?? false,
    title: record?.title ?? "",
  }
}

type HistoryEditorDialogProps = {
  onComplete: () => void
  patientId: string
  record?: EHRMedicalHistoryRecord | null
  triggerLabel: ReactNode
}

export function HistoryEditorDialog({
  onComplete,
  patientId,
  record,
  triggerLabel,
}: HistoryEditorDialogProps) {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const form = useForm<MedicalHistoryInput>({
    defaultValues: getDefaultValues(record),
    resolver: zodResolver(medicalHistorySchema),
  })

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(record))
      setFormError(undefined)
    }
  }, [form, open, record])

  const handleSubmit = (values: MedicalHistoryInput) => {
    setFormError(undefined)

    startTransition(async () => {
      const result = record
        ? await updateMedicalHistoryAction(record.id, values)
        : await addMedicalHistoryAction(patientId, values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof MedicalHistoryInput, {
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

      toast.success(record ? "History updated." : "History record added.")
      setOpen(false)
      onComplete()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger nativeButton={false} render={<div>{triggerLabel}</div>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{record ? "Edit History Record" : "Add History Record"}</DialogTitle>
          <DialogDescription>
            Capture significant conditions, surgeries, and family history.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="history-type">Type</Label>
            <Select
              onValueChange={(value) =>
                form.setValue(
                  "history_type",
                  (value ?? "past_condition") as MedicalHistoryInput["history_type"],
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  }
                )
              }
              value={form.watch("history_type")}
            >
              <SelectTrigger id="history-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {historyTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage message={form.formState.errors.history_type?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history-title">Title</Label>
            <Input id="history-title" {...form.register("title")} />
            <FormMessage message={form.formState.errors.title?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="history-description">Description</Label>
            <Textarea id="history-description" rows={4} {...form.register("description")} />
            <FormMessage message={form.formState.errors.description?.message} />
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="history-date">Date Occurred</Label>
              <Controller
                control={form.control}
                name="date_occurred"
                render={({ field, fieldState }) => (
                  <DatePicker
                    onChange={field.onChange}
                    value={field.value}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" {...form.register("is_resolved")} />
              Is Resolved
            </label>
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
              loadingText={record ? "Saving..." : "Adding..."}
              type="submit"
            >
              {record ? "Save Changes" : "Add Record"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
