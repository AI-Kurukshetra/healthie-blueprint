"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { Bell, ChevronRight, LogOut } from "lucide-react"
import { toast } from "sonner"

import { logoutAction } from "@/actions/auth"
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/notifications"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
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
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <MobileDrawer patientId={patientId} role={role} specialty={specialty} />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              HealthFlow
            </p>
            <h1 className="truncate text-lg font-semibold text-slate-950">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button className="relative" size="icon-sm" variant="outline" />}
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[10px] font-semibold text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
              <span className="sr-only">Open notifications</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-84 rounded-2xl p-0">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Notifications</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recent updates from your care workspace.
                  </p>
                </div>
                <button
                  className="text-xs font-medium text-sky-600 transition hover:text-sky-700 disabled:text-slate-400"
                  disabled={isPending || unreadNotifications === 0}
                  onClick={handleMarkAllAsRead}
                  type="button"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto p-3">
                {notifications.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No notifications yet.
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      className="block w-full rounded-2xl border border-slate-200 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                      disabled={isPending}
                      onClick={() => handleNotificationClick(notification)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-950">
                            {notification.title}
                          </p>
                          <p className="text-sm leading-6 text-slate-600">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read ? (
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" />
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="h-11 gap-3 rounded-2xl px-2.5" variant="outline" />
              }
            >
              <Avatar size="default">
                <AvatarImage alt={fullName} src={avatarUrl ?? undefined} />
                <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="max-w-40 truncate text-sm font-medium text-slate-950">
                  {fullName}
                </p>
                <p className="max-w-40 truncate text-xs text-slate-500">{email}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl p-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                  <Avatar size="lg">
                    <AvatarImage alt={fullName} src={avatarUrl ?? undefined} />
                    <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {fullName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{email}</p>
                    <StatusBadge value={role} />
                  </div>
                </div>
                {specialty ? (
                  <p className="mt-3 text-xs text-slate-500">{specialty}</p>
                ) : patientId ? (
                  <p className="mt-3 text-xs text-slate-500">Patient ID: {patientId}</p>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                <Link
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  href={homeHref}
                >
                  Return to workspace
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <form action={logoutAction}>
                  <button
                    className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                    type="submit"
                  >
                    Sign out
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
