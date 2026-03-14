import { CardGridSkeleton } from "@/components/shared/PageSkeleton"

export default function AuthLoading() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3">
        <div className="h-10 w-40 rounded-2xl bg-slate-100" />
        <div className="h-8 w-56 rounded-2xl bg-slate-100" />
        <div className="h-5 w-72 rounded-2xl bg-slate-100" />
      </div>
      <CardGridSkeleton count={2} />
    </div>
  )
}
