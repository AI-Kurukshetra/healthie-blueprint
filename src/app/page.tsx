import Link from "next/link"
import {
  Activity,
  CalendarClock,
  FileLock2,
  HeartPulse,
  MessagesSquare,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react"

import { HealthFlowLogo } from "@/components/shared/HealthFlowLogo"
import { Button } from "@/components/ui/button"

const features = [
  {
    title: "Secure Consultations",
    description: "Encrypted video visits with clinical-grade reliability.",
    icon: ShieldCheck,
  },
  {
    title: "Live Scheduling",
    description: "Provider and patient booking workflows in real time.",
    icon: CalendarClock,
  },
  {
    title: "Clinical Notes",
    description: "Structured SOAP documentation and signatures.",
    icon: FileLock2,
  },
  {
    title: "Lab Tracking",
    description: "Order, process, and review results from one view.",
    icon: Activity,
  },
  {
    title: "Care Messaging",
    description: "Patient-provider communication in secure threads.",
    icon: MessagesSquare,
  },
  {
    title: "Unified EHR",
    description: "Medication, history, and care-plan continuity.",
    icon: HeartPulse,
  },
]

const steps = [
  {
    title: "1. Register Securely",
    description: "Create your provider or patient account with role-specific onboarding.",
  },
  {
    title: "2. Coordinate Care",
    description: "Schedule visits, exchange messages, and maintain care continuity.",
  },
  {
    title: "3. Deliver Outcomes",
    description: "Complete consultations, notes, labs, and follow-up plans in one system.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <section className="relative overflow-hidden bg-[var(--navy)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,212,184,0.12)_1px,_transparent_1px)] bg-[length:22px_22px]" />
        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between">
            <HealthFlowLogo className="text-white" href="/" light />
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="hf-label text-[var(--teal)]">Clinical Luxury Platform</p>
              <h1 className="mt-4 text-5xl leading-[1.05] font-bold text-white sm:text-6xl">
                Virtual Care,
                <br />
                Delivered With
                <br />
                <span className="text-[var(--teal)]">Precision.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                HealthFlow unifies scheduling, consultation, messaging, notes, labs, and EHR workflows for modern care teams.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button>Start Free</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>

            <div className="hf-card border-[var(--navy-border)] bg-[var(--navy-light)] text-white">
              <p className="hf-label text-slate-400">Platform Snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--navy-border)] bg-[rgba(255,255,255,0.03)] p-3">
                  <p className="text-xs text-slate-400">Appointments</p>
                  <p className="mt-1 text-2xl font-semibold text-white">24/7</p>
                </div>
                <div className="rounded-xl border border-[var(--navy-border)] bg-[rgba(255,255,255,0.03)] p-3">
                  <p className="text-xs text-slate-400">Messaging</p>
                  <p className="mt-1 text-2xl font-semibold text-white">Secure</p>
                </div>
                <div className="rounded-xl border border-[var(--navy-border)] bg-[rgba(255,255,255,0.03)] p-3">
                  <p className="text-xs text-slate-400">Documentation</p>
                  <p className="mt-1 text-2xl font-semibold text-white">SOAP</p>
                </div>
                <div className="rounded-xl border border-[var(--navy-border)] bg-[rgba(255,255,255,0.03)] p-3">
                  <p className="text-xs text-slate-400">Care Plans</p>
                  <p className="mt-1 text-2xl font-semibold text-white">Tracked</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="mb-8">
          <p className="hf-label text-[var(--teal-dark)]">Features</p>
          <h2 className="mt-2 text-4xl font-bold text-[var(--navy)]">Everything your care team needs</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ description, icon: Icon, title }) => (
            <article key={title} className="hf-card hf-card-hover">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--teal-light)] text-[var(--teal)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[var(--navy)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--navy)] py-16 text-white">
        <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
          <p className="hf-label text-[var(--teal)]">How It Works</p>
          <h2 className="mt-2 text-4xl font-bold text-white">Three steps to care continuity</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-[var(--navy-border)] bg-[var(--navy-light)] p-6">
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="hf-card hf-card-hover border-l-4 border-l-[var(--teal)]">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[var(--teal-dark)]" />
              <h3 className="text-2xl font-semibold text-[var(--navy)]">For Providers</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Manage patients, appointments, labs, messaging, and documentation in one premium clinical workspace.
            </p>
          </article>
          <article className="hf-card hf-card-hover border-l-4 border-l-[var(--teal)]">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-[var(--teal-dark)]" />
              <h3 className="text-2xl font-semibold text-[var(--navy)]">For Patients</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
              Access records, lab results, care plans, appointments, and secure messaging through a patient-first portal.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:px-8 lg:px-10">
        <div className="rounded-3xl bg-linear-to-r from-[#00D4B8] to-[#00B09C] p-10 text-white shadow-lg">
          <h2 className="text-4xl font-bold text-white">Ready to modernize virtual care?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90">
            Join HealthFlow and bring scheduling, consultations, notes, messaging, and records together with one clinical-grade platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register">
              <Button variant="secondary">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-[var(--navy)] py-8 text-slate-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm sm:px-8 lg:px-10">
          <span>HealthFlow</span>
          <span>Clinical Luxury Telehealth Platform</span>
        </div>
      </footer>
    </div>
  )
}
