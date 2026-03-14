import type { ReactNode } from "react"

import { Header } from "@/components/layout/Header"
import { PatientSidebar } from "@/components/layout/PatientSidebar"
import { getShellData } from "@/lib/data/app-shell"

export default async function PatientLayout({
  children,
}: {
  children: ReactNode
}) {
  const shell = await getShellData("patient")

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] border-r border-slate-200 bg-white md:block">
          <PatientSidebar patientId={shell.patient?.patient_id} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            avatarUrl={shell.profile.avatar_url}
            email={shell.profile.email}
            fullName={shell.profile.full_name}
            notificationCount={shell.unreadNotificationCount}
            notifications={shell.notifications}
            patientId={shell.patient?.patient_id}
            role="patient"
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
