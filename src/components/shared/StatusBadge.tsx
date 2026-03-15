import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  scheduled: "bg-[#FEF3C7] text-[#92400E]",
  pending: "bg-[#FEF3C7] text-[#92400E]",
  pending_confirmation: "bg-[#FEF3C7] text-[#92400E]",
  draft: "bg-[#FEF3C7] text-[#92400E]",

  confirmed: "bg-[#D1FAE5] text-[#065F46]",
  active: "bg-[#D1FAE5] text-[#065F46]",
  signed: "bg-[#D1FAE5] text-[#065F46]",
  provider: "bg-[#D1FAE5] text-[#065F46]",
  patient: "bg-[#D1FAE5] text-[#065F46]",

  in_progress: "bg-[#DBEAFE] text-[#1E40AF]",
  processing: "bg-[#DBEAFE] text-[#1E40AF]",

  completed: "bg-[#F1F5F9] text-[#475569]",
  no_show: "bg-[#F1F5F9] text-[#475569]",
  amended: "bg-[#F1F5F9] text-[#475569]",

  cancelled: "bg-[#FEE2E2] text-[#991B1B]",
  declined: "bg-[#FEE2E2] text-[#991B1B]",
  urgent: "bg-[#FEE2E2] text-[#991B1B]",
  abnormal: "bg-[#FEE2E2] text-[#991B1B]",

  ordered: "bg-[#DBEAFE] text-[#1E40AF]",
  sample_collected: "bg-[#DBEAFE] text-[#1E40AF]",
  monitoring: "bg-[#FEF3C7] text-[#92400E]",
  new: "bg-[#F1F5F9] text-[#475569]",
  admin: "bg-[#F1F5F9] text-[#475569]",
  resolved: "bg-[#D1FAE5] text-[#065F46]",
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
  const showPulseDot = normalizedTone === "in_progress"

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-0 px-3 py-1 text-[11px] font-semibold",
        statusStyles[normalizedTone] ?? "bg-[#F1F5F9] text-[#475569]",
        className
      )}
    >
      {showPulseDot ? (
        <span className="relative mr-0.5 inline-flex h-2 w-2 rounded-full bg-[#1E40AF]">
          <span className="hf-pulse-dot absolute inset-0 rounded-full bg-[#1E40AF]" />
        </span>
      ) : null}
      {icon}
      {label ?? formatStatusLabel(normalizedValue)}
    </Badge>
  )
}
