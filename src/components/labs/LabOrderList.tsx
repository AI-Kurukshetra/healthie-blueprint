"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useMemo, useState, useTransition } from "react"
import { AlertTriangle, Search } from "lucide-react"
import { toast } from "sonner"

import { updateLabStatusAction } from "@/actions/labs"
import { FetchingOverlay } from "@/components/shared/FetchingOverlay"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type {
  OrderLabPatientOption,
  ProviderLabOrderListItem,
} from "@/lib/data/labs"
import { formatDate } from "@/lib/utils"

import { OrderLabDialog, type LabAppointmentOption } from "./OrderLabDialog"
import { UploadResultDialog } from "./UploadResultDialog"

type LabOrderListProps = {
  appointments?: LabAppointmentOption[]
  description?: string
  emptyDescription?: string
  emptyTitle?: string
  heading?: string
  orderButtonLabel?: string
  orders: ProviderLabOrderListItem[]
  patients: OrderLabPatientOption[]
  prefilledPatientId?: string
}

const tabs = ["all", "ordered", "processing", "completed", "urgent"] as const

function getPriorityBadge(priority: string) {
  if (priority === "stat") {
    return {
      className: "border border-red-200 bg-red-100 text-red-700",
      label: "STAT",
    }
  }

  if (priority === "urgent") {
    return {
      className: "border border-orange-200 bg-orange-100 text-orange-700",
      label: "Urgent",
    }
  }

  return {
    className: "border border-slate-200 bg-slate-100 text-slate-500",
    label: "Routine",
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ordered":
      return {
        className: "border border-blue-200 bg-blue-100 text-blue-700",
        label: "Ordered",
      }
    case "sample_collected":
      return {
        className: "border border-purple-200 bg-purple-100 text-purple-700",
        label: "Sample Collected",
      }
    case "processing":
      return {
        className: "border border-amber-200 bg-amber-100 text-amber-700",
        label: "Processing",
      }
    case "completed":
      return {
        className: "border border-emerald-200 bg-emerald-100 text-emerald-700",
        label: "Completed",
      }
    default:
      return {
        className: "border border-rose-200 bg-rose-100 text-rose-600",
        label: "Cancelled",
      }
  }
}

export function LabOrderList({
  appointments = [],
  description = "Track ordered, processing, and completed lab work in one place.",
  emptyDescription = "Lab orders matching the current filters will appear here.",
  emptyTitle = "No lab orders found",
  heading = "Lab Orders",
  orderButtonLabel = "Order New Lab",
  orders,
  patients,
  prefilledPatientId,
}: LabOrderListProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<(typeof tabs)[number]>("all")
  const [cancelTarget, setCancelTarget] = useState<ProviderLabOrderListItem | null>(null)
  const [formError, setFormError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)

  const filteredOrders = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return orders.filter((order) => {
      const matchesQuery =
        !normalizedQuery ||
        order.orderNumber.toLowerCase().includes(normalizedQuery) ||
        order.testName.toLowerCase().includes(normalizedQuery) ||
        order.patientName.toLowerCase().includes(normalizedQuery) ||
        order.patientId.toLowerCase().includes(normalizedQuery)

      const matchesTab =
        tab === "all" ||
        (tab === "ordered" && order.status === "ordered") ||
        (tab === "processing" &&
          (order.status === "sample_collected" || order.status === "processing")) ||
        (tab === "completed" && order.status === "completed") ||
        (tab === "urgent" && (order.priority === "urgent" || order.priority === "stat"))

      return matchesQuery && matchesTab
    })
  }, [deferredQuery, orders, tab])

  const handleCancel = () => {
    if (!cancelTarget) {
      return
    }

    setFormError(undefined)
    startTransition(async () => {
      const result = await updateLabStatusAction(cancelTarget.id, "cancelled")

      if (result.error) {
        setFormError(result.error)
        return
      }

      toast.success(`${cancelTarget.orderNumber} cancelled.`)
      setCancelTarget(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 hf-card lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">{heading}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
        <OrderLabDialog
          appointments={appointments}
          patients={patients}
          prefilledPatientId={prefilledPatientId}
          triggerLabel={
            <Button>
              {orderButtonLabel}
            </Button>
          }
        />
      </section>

      <section className="hf-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((item) => (
              <button
                key={item}
                className={`min-h-11 rounded-full px-4 text-sm font-medium transition ${
                  tab === item
                    ? "bg-[var(--teal)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--navy)]"
                }`}
                onClick={() => setTab(item)}
                type="button"
              >
                {item === "all"
                  ? "All"
                  : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search lab orders"
              value={query}
            />
          </div>
        </div>
      </section>

      {filteredOrders.length === 0 ? (
        <EmptyState description={emptyDescription} title={emptyTitle} />
      ) : (
        <div className="relative space-y-4">
          <FetchingOverlay isVisible={deferredQuery !== query} />
          {filteredOrders.map((order) => {
            const priority = getPriorityBadge(order.priority)
            const status = getStatusBadge(order.status)
            const canUploadResult =
              order.status !== "cancelled" && order.status !== "completed"
            const canCancel =
              order.status !== "cancelled" && order.status !== "completed"

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">
                        {order.orderNumber}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${priority.className}`}
                      >
                        {priority.label}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-950">
                      {order.testName}
                    </h3>
                    <p className="text-sm text-slate-600">
                      Patient: {order.patientName} ({order.patientId})
                    </p>
                    <p className="text-sm text-slate-500">
                      Ordered: {formatDate(order.orderedAt)}
                    </p>
                    {order.status === "completed" && order.resultSummary ? (
                      <p className="text-sm text-slate-600">
                        Result: {order.resultSummary} -{" "}
                        {formatDate(order.reportedAt ?? order.updatedAt)}
                      </p>
                    ) : order.instructions ? (
                      <p className="text-sm text-slate-600">{order.instructions}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {canUploadResult ? (
                      <UploadResultDialog
                        order={order}
                        triggerLabel={
                          <Button size="sm" variant="outline">
                            Upload Result
                          </Button>
                        }
                      />
                    ) : null}
                    <Link href={`/labs/${order.id}`}>
                      <Button size="sm" variant="outline">
                        {order.status === "completed" ? "View Result" : "View"}
                      </Button>
                    </Link>
                    {canCancel ? (
                      <Button
                        onClick={() => {
                          setFormError(undefined)
                          setCancelTarget(order)
                        }}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null)
            setFormError(undefined)
          }
        }}
        open={Boolean(cancelTarget)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel lab order?</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `Cancel ${cancelTarget.orderNumber} for ${cancelTarget.patientName}?`
                : "Cancel this lab order?"}
            </DialogDescription>
          </DialogHeader>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              This will mark the order as cancelled. Completed orders are left unchanged.
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setCancelTarget(null)
                setFormError(undefined)
              }}
              type="button"
              variant="outline"
            >
              Keep Order
            </Button>
            <LoadingButton
              isLoading={isPending}
              loadingText="Cancelling..."
              onClick={handleCancel}
              type="button"
              variant="destructive"
            >
              Confirm Cancel
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

