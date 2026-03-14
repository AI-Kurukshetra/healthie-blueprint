import { CardGridSkeleton } from "@/components/shared/PageSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function PatientEHRLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-10 w-72" />
        <Skeleton className="mt-3 h-4 w-full max-w-3xl" />
        <Skeleton className="mt-2 h-4 w-2/3 max-w-2xl" />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>
        <div className="mt-6">
          <CardGridSkeleton count={4} />
        </div>
      </section>
    </div>
  )
}
