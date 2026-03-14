import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="w-80 space-y-3 border-r border-slate-200 p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-12 w-2/3 ${index % 2 === 0 ? "self-start" : "self-end"}`}
          />
        ))}
        <Skeleton className="mt-4 h-12 w-full" />
      </div>
    </div>
  )
}
