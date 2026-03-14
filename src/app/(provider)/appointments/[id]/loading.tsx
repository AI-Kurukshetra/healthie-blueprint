import { AppointmentListSkeleton, CardGridSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-10 w-36" />
      </div>
      <AppointmentListSkeleton count={1} />
      <CardGridSkeleton count={2} />
    </div>
  )
}
