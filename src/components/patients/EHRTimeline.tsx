"use client"

import { useState } from "react"

import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import type { EHRTimelineItem as TimelineEntry } from "@/lib/data/timeline"
import { cn } from "@/lib/utils"

import { TimelineItem } from "./TimelineItem"

type TimelineFilter = "all" | "appointment" | "note" | "record" | "lab"

const filterLabels: Array<{
  label: string
  value: TimelineFilter
}> = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Appointments", value: "appointment" },
  { label: "Records", value: "record" },
  { label: "Labs", value: "lab" },
]

type EHRTimelineProps = {
  items: TimelineEntry[]
}

export function EHRTimeline({ items }: EHRTimelineProps) {
  const [filter, setFilter] = useState<TimelineFilter>("all")

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.type === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filterLabels.map((option) => (
          <Button
            key={option.value}
            className={cn(
              "rounded-full px-4",
              filter !== option.value && "text-slate-600"
            )}
            onClick={() => setFilter(option.value)}
            type="button"
            variant={filter === option.value ? "default" : "secondary"}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          description="This patient does not have matching timeline events yet."
          title="No timeline entries"
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
