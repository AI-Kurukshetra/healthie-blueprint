import { clsx, type ClassValue } from "clsx"
import { format, formatDistanceToNow } from "date-fns"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy")
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a")
}

export function formatTime(date: Date | string) {
  return format(new Date(date), "h:mm a")
}

export function formatRelativeTime(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getAppointmentStatusPresentation(
  status: string,
  bookedBy?: string | null
) {
  if (status === "scheduled" && bookedBy === "provider") {
    return {
      label: "Awaiting Patient Confirmation",
      tone: "pending_confirmation",
    }
  }

  if (status === "scheduled" && bookedBy === "patient") {
    return {
      label: "Awaiting Provider Approval",
      tone: "pending_confirmation",
    }
  }

  return {
    label: formatLabel(status),
    tone: status,
  }
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export function truncate(value: string, length: number) {
  if (value.length <= length) {
    return value
  }

  return `${value.slice(0, length).trimEnd()}...`
}
