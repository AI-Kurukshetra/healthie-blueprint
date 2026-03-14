import { Skeleton } from "@/components/ui/skeleton"

export default function LabsLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-24 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-xl lg:max-w-sm" />
        </div>
      </section>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
