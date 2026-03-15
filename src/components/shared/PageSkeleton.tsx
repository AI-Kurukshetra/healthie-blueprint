import { Skeleton } from "@/components/ui/skeleton"

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="hf-card space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-white p-4">
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="hf-card space-y-3">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((__, lineIndex) => (
            <Skeleton key={lineIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  )
}

export function AppointmentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="hf-card flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
