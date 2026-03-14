"use client"

import { useState } from "react"

import { EmptyState } from "@/components/shared/EmptyState"
import type { PatientLabListItem } from "@/lib/data/labs"
import { cn } from "@/lib/utils"

import { LabResultCard } from "./LabResultCard"

type FilterTab = "all" | "pending" | "completed" | "abnormal"

const filterOptions: Array<{ label: string; value: FilterTab }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Abnormal", value: "abnormal" },
]

export function PatientLabsView({ orders }: { orders: PatientLabListItem[] }) {
  const [filter, setFilter] = useState<FilterTab>("all")

  const filteredOrders = orders.filter((order) => {
    if (filter === "pending") {
      return order.status !== "completed" && order.status !== "cancelled"
    }

    if (filter === "completed") {
      return order.status === "completed"
    }

    if (filter === "abnormal") {
      return order.status === "completed" && order.isAbnormal
    }

    return true
  })

  if (orders.length === 0) {
    return (
      <EmptyState
        description="Completed and pending lab work will appear here once ordered."
        title="No lab orders yet"
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className={cn(
              "min-h-11 rounded-full px-4 text-sm font-medium transition",
              filter === option.value
                ? "bg-sky-500 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
            onClick={() => setFilter(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          description="Try another filter to review completed, pending, or abnormal results."
          title="No lab results in this view"
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <LabResultCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
