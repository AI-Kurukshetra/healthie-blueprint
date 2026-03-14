import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  ordered: "border-blue-200 bg-blue-50 text-blue-700",
  sample_collected: "border-purple-200 bg-purple-50 text-purple-700",
  processing: "border-amber-200 bg-amber-50 text-amber-700",
  scheduled: "border-sky-200 bg-sky-50 text-sky-700",
  pending_confirmation: "border-amber-200 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  no_show: "border-slate-200 bg-slate-100 text-slate-700",
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  signed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amended: "border-violet-200 bg-violet-50 text-violet-700",
  provider: "border-sky-200 bg-sky-50 text-sky-700",
  patient: "border-teal-200 bg-teal-50 text-teal-700",
  admin: "border-violet-200 bg-violet-50 text-violet-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  monitoring: "border-amber-200 bg-amber-50 text-amber-700",
  new: "border-slate-200 bg-slate-100 text-slate-700",
}

type StatusBadgeProps = {
  className?: string
  icon?: ReactNode
  label?: string
  tone?: string
  value: string
}

function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function StatusBadge({
  value,
  icon,
  className,
  label,
  tone,
}: StatusBadgeProps) {
  const normalizedValue = value.toLowerCase()
  const normalizedTone = (tone ?? value).toLowerCase()

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
        statusStyles[normalizedTone] ?? "border-slate-200 bg-slate-100 text-slate-700",
        className
      )}
    >
      {icon}
      {label ?? formatStatusLabel(normalizedValue)}
    </Badge>
  )
}
