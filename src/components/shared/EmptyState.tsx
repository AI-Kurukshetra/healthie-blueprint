import type { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-sky-200 bg-white/80 p-10 text-center shadow-sm">
      {icon ? <div className="mx-auto mb-4 flex justify-center text-sky-600">{icon}</div> : null}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-slate-600">{description}</p>
      </div>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
