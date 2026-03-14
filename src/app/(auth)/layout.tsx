import type { ReactNode } from "react"
import { Activity, CalendarCheck2, MessageSquareHeart } from "lucide-react"

import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"

const features = [
  {
    title: "Connected care",
    description: "Coordinate visits, follow-ups, and care plans from one workspace.",
    icon: CalendarCheck2,
  },
  {
    title: "Secure collaboration",
    description: "Keep patients and providers aligned with protected clinical messaging.",
    icon: MessageSquareHeart,
  },
  {
    title: "Clinical clarity",
    description: "Track appointments, consultations, and notes without losing context.",
    icon: Activity,
  },
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden bg-sky-700 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.38),_transparent_35%)]" />
          <div className="relative flex w-full flex-col justify-between p-12 text-white">
            <div className="space-y-12">
              <HealthFlowLogo href="/login" light />

              <div className="max-w-xl space-y-5">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-wide">
                  Virtual Care, Real Results
                </span>
                <h1 className="text-4xl font-semibold tracking-tight text-balance">
                  A modern care platform built for calm operations and better patient trust.
                </h1>
                <p className="max-w-lg text-base leading-7 text-sky-50/90">
                  HealthFlow brings scheduling, communication, consultation, and records
                  into one dependable workspace for providers and patients.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {features.map(({ description, icon: Icon, title }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-lg font-medium">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-sky-50/85">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
