"use client"

import { HeartHandshake } from "lucide-react"

import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"
import { StatusBadge } from "@/components/shared/StatusBadge"

import { patientNavigation } from "./navigation"
import { SidebarLink } from "./SidebarLink"

type PatientSidebarProps = {
  patientId?: string
}

export function PatientSidebar({ patientId }: PatientSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <HealthFlowLogo href="/portal" />
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-950">Patient portal</p>
          <p className="mt-1 text-sm text-slate-600">
            Track appointments, view signed notes, and stay in touch with your care team.
          </p>
          {patientId ? (
            <StatusBadge
              className="mt-3"
              icon={<HeartHandshake className="h-3.5 w-3.5" />}
              value="patient"
            />
          ) : null}
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5">
        {patientNavigation.map((item) => (
          <SidebarLink key={item.href} {...item} />
        ))}
      </nav>
    </div>
  )
}
