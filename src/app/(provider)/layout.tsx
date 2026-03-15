import type { ReactNode } from "react"

import { Header } from "@/components/layout/Header"
import { ProviderSidebar } from "@/components/layout/ProviderSidebar"
import { getShellData } from "@/lib/data/app-shell"

export default async function ProviderLayout({
  children,
}: {
  children: ReactNode
}) {
  const shell = await getShellData("provider")

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] border-r border-[rgba(0,212,184,0.2)] bg-[linear-gradient(160deg,#021a12_0%,#011209_60%,#021510_100%)] md:block">
          <ProviderSidebar fullName={shell.profile.full_name} specialty={shell.provider?.specialty} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            avatarUrl={shell.profile.avatar_url}
            email={shell.profile.email}
            fullName={shell.profile.full_name}
            notificationCount={shell.unreadNotificationCount}
            notifications={shell.notifications}
            role="provider"
            specialty={shell.provider?.specialty}
          />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
