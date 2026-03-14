"use client"

import { Stethoscope } from "lucide-react"

import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"
import { StatusBadge } from "@/components/shared/StatusBadge"

import { providerNavigation } from "./navigation"
import { SidebarLink } from "./SidebarLink"

type ProviderSidebarProps = {
  specialty?: string
}

export function ProviderSidebar({ specialty }: ProviderSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <HealthFlowLogo href="/dashboard" />
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-950">Provider workspace</p>
          <p className="mt-1 text-sm text-slate-600">
            Review your care queue, alerts, and schedule from one place.
          </p>
          {specialty ? (
            <StatusBadge
              className="mt-3"
              icon={<Stethoscope className="h-3.5 w-3.5" />}
              value="provider"
            />
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {providerNavigation.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
  )
}
