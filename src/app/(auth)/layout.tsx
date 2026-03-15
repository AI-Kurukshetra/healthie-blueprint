import type { ReactNode } from "react"

import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"

const featurePills = ["HIPAA", "Video", "Real-time"]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="grid min-h-screen lg:grid-cols-[45%_55%]">
        <aside className="relative hidden overflow-hidden bg-linear-to-br from-[var(--navy)] to-[var(--navy-light)] lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,212,184,0.12)_1px,_transparent_1px)] bg-[length:22px_22px]" />
          <div className="relative flex w-full flex-col justify-between p-12 text-white">
            <div className="space-y-10">
              <HealthFlowLogo href="/login" light />

              <div className="max-w-xl space-y-5">
                <h1 className="text-6xl leading-[1.05] font-bold tracking-tight text-white">
                  Virtual Care,
                  <br />
                  Delivered With
                  <br />
                  <span className="text-[var(--teal)]">Precision.</span>
                </h1>
                <p className="max-w-sm text-[15px] leading-7 text-slate-300">
                  Clinical-grade telehealth for providers and patients, designed for trust, clarity, and continuity of care.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {featurePills.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[rgba(0,212,184,0.4)] px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-[var(--teal)] uppercase"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-2xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
