"use client"

import { useTransition } from "react"
import { HeartPulse, Loader2, LogOut } from "lucide-react"

import { logoutAction } from "@/actions/auth"
import { getInitials } from "@/lib/utils"

import { providerNavigation } from "./navigation"
import { SidebarLink } from "./SidebarLink"

type ProviderSidebarProps = {
  fullName: string
  specialty?: string
}

function groupBySection() {
  const groups = new Map<string, typeof providerNavigation>()

  providerNavigation.forEach((item) => {
    const existing = groups.get(item.section) ?? []
    groups.set(item.section, [...existing, item])
  })

  return [...groups.entries()]
}

export function ProviderSidebar({ fullName, specialty }: ProviderSidebarProps) {
  const [isSigningOut, startSigningOut] = useTransition()
  const sections = groupBySection()

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[linear-gradient(160deg,#021a12_0%,#011209_60%,#021510_100%)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-5 h-[180px] w-[180px] rounded-full bg-[radial-gradient(circle,rgba(0,212,184,0.25)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-30px] bottom-0 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)]"
      />

      <div className="relative px-[18px] pt-[22px] pb-[18px]">
        <div className="flex items-center gap-3">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-linear-to-br from-[#00D4B8] to-[#059669] text-white shadow-[0_4px_20px_rgba(0,212,184,0.45)]">
            <HeartPulse className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-display text-[16px] font-bold text-white">HealthFlow</p>
            <p className="text-[9px] font-semibold tracking-[0.1em] text-[rgba(52,211,153,0.9)] uppercase">
              Virtual Care
            </p>
          </div>
        </div>
      </div>
      <div className="mx-[14px] mb-1 h-px bg-linear-to-r from-transparent via-[rgba(0,212,184,0.3)] to-transparent" />

      <nav className="relative flex-1 overflow-y-auto px-3 pb-4">
        {sections.map(([section, items], index) => (
          <div key={section} className="pb-1">
            <p
              className={
                index === 0
                  ? "px-[10px] pt-[12px] pb-1 text-[9px] font-bold tracking-[0.15em] text-[rgba(52,211,153,0.65)] uppercase"
                  : "px-[10px] pt-[10px] pb-1 text-[9px] font-bold tracking-[0.15em] text-[rgba(52,211,153,0.65)] uppercase"
              }
            >
              {section}
            </p>
            <div className="space-y-0.5 py-0.5">
              {items.map((item) => (
                <SidebarLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative px-3 pb-[18px]">
        <div className="mb-3 h-px bg-linear-to-r from-transparent via-[rgba(0,212,184,0.2)] to-transparent" />
        <div className="flex cursor-pointer items-center gap-[10px] rounded-[12px] border border-[rgba(0,212,184,0.2)] bg-[rgba(0,212,184,0.10)] px-3 py-2.5 transition-all duration-200 hover:border-[rgba(0,212,184,0.35)] hover:bg-[rgba(0,212,184,0.15)]">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-linear-to-br from-[#00D4B8] to-[#059669] text-[12px] font-bold text-white shadow-[0_2px_10px_rgba(0,212,184,0.4)]">
            {getInitials(fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white">{fullName}</p>
            <p className="truncate text-[10px] text-[rgba(52,211,153,0.8)]">
              {specialty || "Provider"}
            </p>
          </div>
          <button
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[rgba(255,255,255,0.4)] transition hover:text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSigningOut}
            onClick={() => {
              startSigningOut(async () => {
                await logoutAction()
              })
            }}
            title="Sign out"
            type="button"
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin text-[var(--teal)]" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="sr-only">{isSigningOut ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
