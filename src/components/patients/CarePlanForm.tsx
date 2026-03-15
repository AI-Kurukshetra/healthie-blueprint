"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Controller, useForm } from "react-hook-form"

import { saveCarePlan } from "@/actions/care-plan"
import { DatePicker } from "@/components/shared/DatePicker"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { FormMessage } from "@/components/ui/form-message"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CarePlanSummary } from "@/lib/data/care-plan"
import { cn, formatDateTime } from "@/lib/utils"
import { carePlanSchema, type CarePlanInput, type CarePlanStatus } from "@/lib/validations/care-plan"

const statusOptions: Array<{
  label: string
  value: Exclude<CarePlanStatus, "draft">
}> = [
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
]

type CarePlanFormProps = {
  initialPlan: CarePlanSummary | null
  patientId: string
  patientName: string
}

type SubmitAction = "draft" | "publish" | null

function getDefaultValues(initialPlan: CarePlanSummary | null): CarePlanInput {
  return {
    diet_notes: initialPlan?.dietNotes ?? "",
    end_date: initialPlan?.endDate ?? "",
    exercise: initialPlan?.exercise ?? "",
    follow_up: initialPlan?.followUp ?? "",
    goals: initialPlan?.goals ?? "",
    instructions: initialPlan?.instructions ?? "",
    start_date: initialPlan?.startDate ?? new Date().toISOString().split("T")[0],
    status:
      initialPlan?.status === "paused" || initialPlan?.status === "completed"
        ? initialPlan.status
        : "active",
    title: initialPlan?.title ?? "",
  }
}

export function CarePlanForm({
  initialPlan,
  patientId,
  patientName,
}: CarePlanFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitAction, setSubmitAction] = useState<SubmitAction>(null)
  const [formError, setFormError] = useState<string>()
  const form = useForm<CarePlanInput>({
    defaultValues: getDefaultValues(initialPlan),
    resolver: zodResolver(carePlanSchema),
  })
  const selectedStatus = form.watch("status")
  const selectedStartDate = form.watch("start_date")

  const handleSubmit = (values: CarePlanInput, action: SubmitAction) => {
    setSubmitAction(action)
    setFormError(undefined)

    startTransition(async () => {
      const result = await saveCarePlan(
        patientId,
        values,
        action === "draft" ? "draft" : undefined
      )

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof CarePlanInput, {
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

      toast.success(action === "draft" ? "Care plan saved" : "Care plan activated")
      router.refresh()
    })
  }

  const primaryActionLabel =
    selectedStatus === "paused"
      ? "Save Paused Plan"
      : selectedStatus === "completed"
        ? "Save Completed Plan"
        : "Activate Plan"

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit((values) => handleSubmit(values, "publish"))}>
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">Care planning</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Care Plan for {patientName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Define goals, follow-up, lifestyle guidance, and treatment instructions in
              one structured plan.
            </p>
          </div>
          <div className="space-y-2 text-right">
            {initialPlan ? (
              <p className="text-sm text-slate-500">
                Last updated {formatDateTime(initialPlan.updatedAt)}
              </p>
            ) : null}
            {initialPlan ? <StatusBadge value={initialPlan.status} /> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="care-plan-title">Title</Label>
            <Input id="care-plan-title" {...form.register("title")} />
            <FormMessage message={form.formState.errors.title?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care-plan-goals">Goals</Label>
            <Textarea
              id="care-plan-goals"
              className="min-h-[120px]"
              {...form.register("goals")}
            />
            <FormMessage message={form.formState.errors.goals?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care-plan-instructions">Treatment Instructions</Label>
            <Textarea
              id="care-plan-instructions"
              className="min-h-[120px]"
              {...form.register("instructions")}
            />
            <FormMessage message={form.formState.errors.instructions?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care-plan-diet">Diet & Nutrition</Label>
            <Textarea
              id="care-plan-diet"
              className="min-h-[120px]"
              {...form.register("diet_notes")}
            />
            <FormMessage message={form.formState.errors.diet_notes?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care-plan-exercise">Exercise & Activity</Label>
            <Textarea
              id="care-plan-exercise"
              className="min-h-[120px]"
              {...form.register("exercise")}
            />
            <FormMessage message={form.formState.errors.exercise?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="care-plan-follow-up">Follow-up Schedule</Label>
            <Textarea
              id="care-plan-follow-up"
              className="min-h-[120px]"
              {...form.register("follow_up")}
            />
            <FormMessage message={form.formState.errors.follow_up?.message} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="care-plan-start-date">Start Date</Label>
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
              <Label htmlFor="care-plan-end-date">End Date</Label>
              <Controller
                control={form.control}
                name="end_date"
                render={({ field, fieldState }) => (
                  <DatePicker
                    allowClear
                    minDate={selectedStartDate ? new Date(`${selectedStartDate}T00:00:00`) : undefined}
                    onChange={field.onChange}
                    placeholder="Select end date"
                    value={field.value}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Button
                  key={option.value}
                  className={cn(
                    "rounded-full px-4",
                    selectedStatus === option.value
                      ? "border-[rgba(0,212,184,0.45)] bg-[rgba(0,212,184,0.16)] text-[var(--teal-dark)] hover:bg-[rgba(0,212,184,0.22)]"
                      : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                  onClick={() =>
                    form.setValue("status", option.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  type="button"
                  variant="secondary"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {formError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href={`/patients/${patientId}`}>
          <Button type="button" variant="outline">
            Back to Patient
          </Button>
        </Link>
        <LoadingButton
          isLoading={isPending && submitAction === "draft"}
          loadingText="Saving..."
          onClick={form.handleSubmit((values) => handleSubmit(values, "draft"))}
          type="button"
          variant="secondary"
        >
          Save Draft
        </LoadingButton>
        <LoadingButton
          isLoading={isPending && submitAction === "publish"}
          loadingText="Saving..."
          type="submit"
        >
          {primaryActionLabel}
        </LoadingButton>
      </div>
    </form>
  )
}
