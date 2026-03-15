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
        "group relative mx-0 my-[2px] flex w-full cursor-pointer items-center gap-[10px] rounded-[10px] px-3 py-[9px] text-left transition-all duration-200 ease-in-out",
        isActive
          ? "border border-[rgba(0,212,184,0.35)] bg-[linear-gradient(135deg,rgba(0,212,184,0.20),rgba(5,150,105,0.10))] text-white shadow-[0_0_20px_rgba(0,212,184,0.15)]"
          : "text-[rgba(255,255,255,0.7)] hover:translate-x-[3px] hover:bg-[rgba(0,212,184,0.08)] hover:text-[rgba(255,255,255,0.9)]"
      )}
      onClick={handleClick}
      type="button"
    >
      {isNavigating ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#00D4B8]" />
      ) : (
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors [stroke-width:1.75]",
            isActive
              ? "text-[#6EE7B7]"
              : "text-[rgba(255,255,255,0.5)] group-hover:text-[rgba(255,255,255,0.75)]"
          )}
        />
      )}
      <span
        className={cn(
          "text-[13px]",
          isActive ? "font-semibold text-white" : "font-normal text-inherit"
        )}
      >
        {label}
      </span>
      {isActive ? (
        <span
          aria-hidden
          className="absolute right-[10px] h-[5px] w-[5px] rounded-full bg-[#00D4B8] shadow-[0_0_8px_rgba(0,212,184,1)]"
        />
      ) : null}
    </button>
  )
}
