import { Skeleton } from "@/components/ui/skeleton"

export default function PortalLabsLoading() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-3 h-4 w-80" />
      </section>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-24 rounded-full" />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
