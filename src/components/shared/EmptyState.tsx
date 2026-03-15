import type { ReactNode } from "react"
import { Users } from "lucide-react"

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
    <div className="hf-card text-center">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--teal-light)] text-[var(--teal)]">
          {icon ?? <Users className="h-10 w-10" />}
        </div>
        <h3 className="text-xl font-semibold text-[var(--navy)]">{title}</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  )
}
