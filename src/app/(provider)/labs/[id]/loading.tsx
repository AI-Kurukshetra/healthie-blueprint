import { Skeleton } from "@/components/ui/skeleton"

export default function LabOrderDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </section>
    </div>
  )
}
