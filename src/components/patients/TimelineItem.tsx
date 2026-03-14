import { CalendarDays, ClipboardList, FilePenLine, FlaskConical } from "lucide-react"
import Link from "next/link"

import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import type { EHRTimelineItem } from "@/lib/data/timeline"
import { cn, formatDateTime, truncate } from "@/lib/utils"

const timelineStyles: Record<
  EHRTimelineItem["type"],
  {
    badgeClassName: string
    ctaLabel: string
    icon: typeof FilePenLine
    wrapperClassName: string
  }
> = {
  note: {
    badgeClassName: "border-sky-200 bg-sky-100 text-sky-700",
    ctaLabel: "View Note",
    icon: FilePenLine,
    wrapperClassName: "border-sky-200 bg-sky-50",
  },
  appointment: {
    badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
    ctaLabel: "View Appointment",
    icon: CalendarDays,
    wrapperClassName: "border-emerald-200 bg-emerald-50",
  },
  record: {
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    ctaLabel: "Open Record",
    icon: ClipboardList,
    wrapperClassName: "border-amber-200 bg-amber-50",
  },
  lab: {
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    ctaLabel: "View Result",
    icon: FlaskConical,
    wrapperClassName: "border-amber-200 bg-amber-50",
  },
}

type TimelineItemProps = {
  item: EHRTimelineItem
}

export function TimelineItem({ item }: TimelineItemProps) {
  const styles = timelineStyles[item.type]
  const Icon = styles.icon

  return (
    <article
      className={cn(
        "rounded-3xl border p-5 shadow-sm transition hover:shadow-md",
        styles.wrapperClassName
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
            <Icon className="h-5 w-5" />
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-500">
                {formatDateTime(item.date)}
              </p>
              <Badge className={cn("rounded-full border", styles.badgeClassName)}>
                {item.badge}
              </Badge>
              {item.status ? <StatusBadge value={item.status} /> : null}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {truncate(item.description, 140)}
              </p>
            </div>
          </div>
        </div>

        <Link
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          href={item.href}
        >
          {styles.ctaLabel}
        </Link>
      </div>
    </article>
  )
}
