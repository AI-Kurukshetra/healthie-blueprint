import { CardGridSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function PortalEHRLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-2/3 max-w-xl" />
          </div>
        </div>
      </section>

      <CardGridSkeleton count={4} />
      <CardGridSkeleton count={2} />
    </div>
  )
}
