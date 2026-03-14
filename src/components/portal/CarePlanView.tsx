import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import type { CarePlanSummary } from "@/lib/data/care-plan"
import { formatDateTime } from "@/lib/utils"

type CarePlanViewProps = {
  plan: CarePlanSummary | null
}

const sections: Array<{
  key: keyof Pick<
    CarePlanSummary,
    "dietNotes" | "exercise" | "followUp" | "goals" | "instructions"
  >
  title: string
}> = [
  { key: "goals", title: "Goals" },
  { key: "instructions", title: "Treatment Instructions" },
  { key: "dietNotes", title: "Diet & Nutrition" },
  { key: "exercise", title: "Exercise & Activity" },
  { key: "followUp", title: "Follow-up" },
]

export function CarePlanView({ plan }: CarePlanViewProps) {
  if (!plan) {
    return (
      <EmptyState
        description="Your provider hasn't created a care plan for you yet. Contact your provider if you think you need one."
        title="No Care Plan Yet"
      />
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">My care plan</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {plan.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {plan.providerName} - Last updated {formatDateTime(plan.updatedAt)}
            </p>
          </div>
          <StatusBadge value={plan.status} />
        </div>
      </section>

      {sections.map((section) => {
        const content = plan[section.key]

        return (
          <section
            key={section.key}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {content || "No details shared yet."}
            </p>
          </section>
        )
      })}
    </div>
  )
}
