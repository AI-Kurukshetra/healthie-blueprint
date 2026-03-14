import { StatsCardsSkeleton, TableSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <StatsCardsSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <TableSkeleton rows={4} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <TableSkeleton rows={4} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-[220px] w-full" />
        </div>
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mx-auto h-[220px] w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
