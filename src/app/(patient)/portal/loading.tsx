import { AppointmentListSkeleton, StatsCardsSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-56" />
      <StatsCardsSkeleton />
      <Skeleton className="h-6 w-48" />
      <AppointmentListSkeleton count={3} />
    </div>
  )
}
