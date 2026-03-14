import Link from "next/link"
import { HeartPulse } from "lucide-react"

import { cn } from "@/lib/utils"

type HealthFlowLogoProps = {
  className?: string
  href?: string
  light?: boolean
}

export function HealthFlowLogo({
  className,
  href = "/login",
  light = false,
}: HealthFlowLogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-lg font-semibold tracking-tight",
        light ? "text-white" : "text-slate-950",
        className
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm",
          light ? "bg-white/15 text-white ring-1 ring-white/20" : "bg-sky-500 text-white"
        )}
      >
        <HeartPulse className="h-5 w-5" />
      </span>
      <span>HealthFlow</span>
    </span>
  )

  return <Link href={href}>{content}</Link>
}
