"use client"

import { useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { updatePatientAllergiesAndConditionsAction } from "@/actions/ehr"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Badge } from "@/components/ui/badge"
import { FormMessage } from "@/components/ui/form-message"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { allergiesAndConditionsSchema, type AllergiesAndConditionsInput } from "@/lib/validations/ehr"

function toCommaSeparated(values: string[]) {
  return values.join(", ")
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

type AllergiesConditionsEditorProps = {
  allergies: string[]
  chronicConditions: string[]
  onComplete: () => void
  patientId: string
}

export function AllergiesConditionsEditor({
  allergies,
  chronicConditions,
  onComplete,
  patientId,
}: AllergiesConditionsEditorProps) {
  const [isPending, startTransition] = useTransition()
  const form = useForm<AllergiesAndConditionsInput>({
    defaultValues: {
      allergies,
      chronic_conditions: chronicConditions,
    },
    resolver: zodResolver(allergiesAndConditionsSchema),
  })
  const allergyValues = form.watch("allergies") ?? []
  const chronicConditionValues = form.watch("chronic_conditions") ?? []

  const handleSubmit = (values: AllergiesAndConditionsInput) => {
    startTransition(async () => {
      const result = await updatePatientAllergiesAndConditionsAction(patientId, values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof AllergiesAndConditionsInput, {
              message: messages[0],
              type: "server",
            })
          }
        })
      }

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Allergies and conditions updated.")
      onComplete()
    })
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="allergies-input">Allergies</Label>
          <Textarea
            id="allergies-input"
            onChange={(event) =>
              form.setValue("allergies", splitCommaSeparated(event.target.value), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            rows={5}
            value={toCommaSeparated(allergyValues)}
          />
          <p className="text-xs text-slate-500">Separate tags with commas.</p>
          <FormMessage message={form.formState.errors.allergies?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="conditions-input">Chronic Conditions</Label>
          <Textarea
            id="conditions-input"
            onChange={(event) =>
              form.setValue(
                "chronic_conditions",
                splitCommaSeparated(event.target.value),
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              )
            }
            rows={5}
            value={toCommaSeparated(chronicConditionValues)}
          />
          <p className="text-xs text-slate-500">Separate tags with commas.</p>
          <FormMessage message={form.formState.errors.chronic_conditions?.message} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <h3 className="text-lg font-semibold text-rose-700">Allergy Tags</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {allergyValues.length > 0 ? (
              allergyValues.map((item) => (
                <Badge
                  key={item}
                  className="rounded-full border border-rose-200 bg-white text-rose-700"
                >
                  {item}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-rose-700/80">No known allergies.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-lg font-semibold text-amber-700">Chronic Condition Tags</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {chronicConditionValues.length > 0 ? (
              chronicConditionValues.map((item) => (
                <Badge
                  key={item}
                  className="rounded-full border border-amber-200 bg-white text-amber-700"
                >
                  {item}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-amber-700/80">No chronic conditions recorded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <LoadingButton
          isLoading={isPending}
          loadingText="Saving..."
          type="submit"
        >
          Save Changes
        </LoadingButton>
      </div>
    </form>
  )
}
