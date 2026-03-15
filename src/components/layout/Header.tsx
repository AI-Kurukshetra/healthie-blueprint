"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { Bell, HeartPulse, Loader2, LogOut, Search, Settings } from "lucide-react"
import { toast } from "sonner"

import { logoutAction } from "@/actions/auth"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelativeTime, getInitials } from "@/lib/utils"

import { MobileDrawer } from "./MobileDrawer"
import { getPageTitle, type AppRole } from "./navigation"

type HeaderNotification = {
  created_at: string
  id: string
  is_read: boolean
  link: string | null
  message: string
  title: string
  type: string
}

type HeaderProps = {
  avatarUrl?: string | null
  email: string
  fullName: string
  notificationCount: number
  notifications: HeaderNotification[]
  patientId?: string
  role: AppRole
  specialty?: string
}

export function Header({
  avatarUrl,
  email,
  fullName,
  notificationCount,
  notifications,
  patientId,
  role,
  specialty,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const title = getPageTitle(role, pathname)
  const homeHref = role === "provider" ? "/dashboard" : "/portal"
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length

  const handleNotificationClick = (notification: HeaderNotification) => {
    startTransition(async () => {
      if (!notification.is_read) {
        const result = await markNotificationReadAction(notification.id)

        if (result.error) {
          toast.error(result.error)
          return
        }
      }

      router.push(notification.link || homeHref)
      router.refresh()
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()

      if (result.error) {
        toast.error(result.error)
        return
      }

      router.refresh()
    })
  }

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-[var(--border)] bg-white">
      <div className="relative flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <MobileDrawer
              fullName={fullName}
              patientId={patientId}
              role={role}
              specialty={specialty}
            />
          </div>
          <h1 className="hidden text-[22px] leading-none font-semibold text-[var(--navy)] md:block">
            {title}
          </h1>
        </div>

        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,212,184,0.12)] text-[var(--teal)]">
              <HeartPulse className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold tracking-tight text-[var(--navy)]">HealthFlow</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            className="hidden text-slate-400 hover:text-[var(--teal)] md:inline-flex"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Search className="h-[18px] w-[18px]" />
            <span className="sr-only">Search</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="relative text-slate-400 hover:text-[var(--teal)]" size="icon" variant="ghost" />
              }
            >
              <Bell className="h-[18px] w-[18px]" />
              {notificationCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--teal)] px-1 text-[10px] leading-none font-semibold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
              <span className="sr-only">Open notifications</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-xl border border-[var(--border)] p-0 shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--navy)]">Notifications</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Recent updates in your workspace.</p>
                </div>
                <button
                  className="text-xs font-medium text-[var(--teal)] transition hover:text-[var(--teal-dark)] disabled:text-slate-400"
                  disabled={isPending || unreadNotifications === 0}
                  onClick={handleMarkAllAsRead}
                  type="button"
                >
                  Mark all
                </button>
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto p-3">
                {notifications.length === 0 ? (
                  <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-sm text-[var(--text-muted)]">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className="block w-full rounded-xl border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--teal)]/30 hover:bg-[var(--teal-light)]"
                      disabled={isPending}
                      onClick={() => handleNotificationClick(notification)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[var(--navy)]">{notification.title}</p>
                          <p className="text-sm leading-6 text-[var(--text-muted)]">{notification.message}</p>
                        </div>
                        {!notification.is_read ? (
                          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--teal)]" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-hint)]">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="mx-1 hidden h-6 w-px bg-[var(--border)] md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-[var(--teal)]/30" type="button" variant="ghost" />
              }
            >
              <Avatar className="h-9 w-9 ring-1 ring-white" size="lg">
                <AvatarImage alt={fullName} src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-linear-to-br from-[var(--teal)] to-[var(--teal-dark)] font-semibold text-white">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-xl border border-[var(--border)] p-2 shadow-xl">
              <div className="rounded-lg px-2 py-2">
                <p className="truncate text-sm font-semibold text-[var(--navy)]">{fullName}</p>
                <p className="truncate text-xs text-[var(--text-muted)]">{email}</p>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem>
                <Link className="flex w-full items-center justify-between" href={homeHref}>
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </span>
                </Link>
              </DropdownMenuItem>

              <form action={logoutAction}>
                <button
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                  type="submit"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </span>
                </button>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
