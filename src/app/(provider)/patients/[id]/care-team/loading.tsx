import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-36" />
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  )
}
