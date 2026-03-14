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
  patientId?: string
  role: AppRole
  specialty?: string
}

export function MobileDrawer({
  patientId,
  role,
  specialty,
}: MobileDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button className="md:hidden" size="icon-sm" variant="outline" />}
      >
        <Menu className="h-4 w-4" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent className="w-[280px] p-0" side="left">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        {role === "provider" ? (
          <ProviderSidebar specialty={specialty} />
        ) : (
          <PatientSidebar patientId={patientId} />
        )}
      </SheetContent>
    </Sheet>
  )
}
