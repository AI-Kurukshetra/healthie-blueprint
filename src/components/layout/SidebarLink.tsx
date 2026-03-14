"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SidebarLinkProps = {
  href: string
  icon: LucideIcon
  label: string
}

export function SidebarLink({ href, icon: Icon, label }: SidebarLinkProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  const handleClick = () => {
    if (pathname === href) {
      return
    }

    setIsNavigating(true)
    router.push(href)
    window.setTimeout(() => setIsNavigating(false), 1500)
  }

  return (
    <button
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150",
        isActive
          ? "bg-sky-50 text-sky-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      )}
      onClick={handleClick}
      type="button"
    >
      {isNavigating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className="h-4 w-4 shrink-0" />
      )}
      {label}
    </button>
  )
}
