"use client"

import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import type { AppRole } from "./navigation"
import { PatientSidebar } from "./PatientSidebar"
import { ProviderSidebar } from "./ProviderSidebar"

type MobileDrawerProps = {
  fullName: string
  patientId?: string
  role: AppRole
  specialty?: string
}

export function MobileDrawer({
  fullName,
  patientId,
  role,
  specialty,
}: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button className="cursor-pointer md:hidden" size="icon" variant="ghost" />}
      >
        <Menu className="h-[18px] w-[18px]" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent
        className="w-[280px] border-r border-[rgba(0,212,184,0.2)] bg-[linear-gradient(160deg,#021a12_0%,#011209_60%,#021510_100%)] p-0"
        side="left"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        {role === "provider" ? (
          <ProviderSidebar fullName={fullName} specialty={specialty} />
        ) : (
          <PatientSidebar fullName={fullName} patientId={patientId} />
        )}
      </SheetContent>
    </Sheet>
  )
}
