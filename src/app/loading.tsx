import { CardGridSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-3">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <CardGridSkeleton count={3} />
    </div>
  )
}
