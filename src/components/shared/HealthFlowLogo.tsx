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
        "inline-flex items-center gap-3 text-lg font-bold tracking-tight",
        light ? "text-white" : "text-[var(--navy)]",
        className
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          light
            ? "bg-[rgba(0,212,184,0.2)] text-[var(--teal)] ring-1 ring-white/20"
            : "bg-[rgba(0,212,184,0.12)] text-[var(--teal)]"
        )}
      >
        <HeartPulse className="h-5 w-5" />
      </span>
      <span>HealthFlow</span>
    </span>
  )

  return <Link href={href}>{content}</Link>
}
