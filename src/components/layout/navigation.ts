import type { LucideIcon } from "lucide-react"
import {
  CalendarDays,
  CalendarPlus2,
  ClipboardList,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  MessageSquareMore,
  Users,
} from "lucide-react"

export type AppRole = "provider" | "patient"

export type NavigationItem = {
  href: string
  icon: LucideIcon
  label: string
  section: string
}

export const providerNavigation: NavigationItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    section: "MAIN",
  },
  {
    href: "/patients",
    icon: Users,
    label: "Patients",
    section: "PATIENT CARE",
  },
  {
    href: "/appointments",
    icon: CalendarPlus2,
    label: "Appointments",
    section: "PATIENT CARE",
  },
  {
    href: "/notes",
    icon: FileText,
    label: "Notes",
    section: "PATIENT CARE",
  },
  {
    href: "/labs",
    icon: FlaskConical,
    label: "Labs",
    section: "PATIENT CARE",
  },
  {
    href: "/messages",
    icon: MessageSquareMore,
    label: "Messages",
    section: "COMMUNICATION",
  },
]

export const patientNavigation: NavigationItem[] = [
  {
    href: "/portal/appointments",
    icon: CalendarDays,
    label: "Appointments",
    section: "MAIN",
  },
  {
    href: "/portal/records",
    icon: FileText,
    label: "Records",
    section: "MAIN",
  },
  {
    href: "/portal/care-plan",
    icon: ClipboardList,
    label: "Care Plan",
    section: "HEALTH",
  },
  {
    href: "/portal/labs",
    icon: FlaskConical,
    label: "Lab Results",
    section: "HEALTH",
  },
  {
    href: "/portal/ehr",
    icon: HeartPulse,
    label: "EHR",
    section: "HEALTH",
  },
  {
    href: "/portal/messages",
    icon: MessageSquareMore,
    label: "Messages",
    section: "COMMUNICATION",
  },
]

export function getPageTitle(role: AppRole, pathname: string) {
  if (role === "provider") {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      return "Provider Dashboard"
    }

    if (pathname.startsWith("/patients")) {
      return "Patients"
    }

    if (pathname.startsWith("/appointments")) {
      return "Appointments"
    }

    if (pathname.startsWith("/notes")) {
      return "Clinical Notes"
    }

    if (pathname.startsWith("/labs")) {
      return "Lab Orders"
    }

    if (pathname.startsWith("/messages")) {
      return "Messages"
    }

    return "HealthFlow"
  }

  if (pathname === "/portal" || pathname === "/portal/") {
    return "Patient Portal"
  }

  if (pathname.startsWith("/portal/appointments")) {
    return "My Appointments"
  }

  if (pathname.startsWith("/portal/records")) {
    return "My Records"
  }

  if (pathname.startsWith("/portal/ehr")) {
    return "My Health Records"
  }

  if (pathname.startsWith("/portal/labs")) {
    return "My Lab Results"
  }

  if (pathname.startsWith("/portal/messages")) {
    return "Messages"
  }

  if (pathname.startsWith("/portal/care-plan")) {
    return "My Care Plan"
  }

  return "HealthFlow"
}
