import { CalendarDays, Clock3, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { LoadingButton } from "@/components/shared/LoadingButton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"

type WaitingRoomProps = {
  backHref: string
  cameraEnabled: boolean
  canJoin: boolean
  isJoining: boolean
  micEnabled: boolean
  onJoin: () => void
  onToggleCamera: () => void
  onToggleMic: () => void
  patientCode: string
  patientName: string
  permissionError: string | null
  providerName: string
  reason: string | null
  scheduledAt: string
  specialty: string
  status: string
  type: string
}

export function WaitingRoom({
  backHref,
  cameraEnabled,
  canJoin,
  isJoining,
  micEnabled,
  onJoin,
  onToggleCamera,
  onToggleMic,
  patientCode,
  patientName,
  permissionError,
  providerName,
  reason,
  scheduledAt,
  specialty,
  status,
  type,
}: WaitingRoomProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">Consultation waiting room</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Prepare your device before joining
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Review the visit details, confirm your microphone and camera state,
              then join the secure room when ready.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={status} />
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              {type.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
          <div className="flex h-full min-h-[360px] flex-col justify-between rounded-[24px] border border-white/10 bg-white/5 p-6">
            <div className="space-y-3">
              <Badge className="rounded-full bg-white/10 text-white">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Secure session
              </Badge>
              <h3 className="text-2xl font-semibold">Device readiness</h3>
              <p className="max-w-xl text-sm leading-6 text-slate-200">
                Your camera and microphone settings are applied as soon as you join.
                You can change them again during the session.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                className={`rounded-3xl border px-5 py-4 text-left transition ${
                  micEnabled
                    ? "border-emerald-300/40 bg-emerald-400/10"
                    : "border-rose-300/30 bg-rose-400/10"
                }`}
                onClick={onToggleMic}
                type="button"
              >
                <p className="text-sm font-medium text-white">Microphone</p>
                <p className="mt-2 text-sm text-slate-200">
                  {micEnabled ? "Ready for audio" : "Muted before join"}
                </p>
              </button>
              <button
                className={`rounded-3xl border px-5 py-4 text-left transition ${
                  cameraEnabled
                    ? "border-emerald-300/40 bg-emerald-400/10"
                    : "border-rose-300/30 bg-rose-400/10"
                }`}
                onClick={onToggleCamera}
                type="button"
              >
                <p className="text-sm font-medium text-white">Camera</p>
                <p className="mt-2 text-sm text-slate-200">
                  {cameraEnabled ? "Preview starts on join" : "Video stays off"}
                </p>
              </button>
            </div>

            {permissionError ? (
              <p className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {permissionError}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LoadingButton
                className="w-full rounded-full bg-sky-500 text-white hover:bg-sky-600 sm:w-auto"
                disabled={!canJoin}
                isLoading={isJoining}
                loadingText="Joining..."
                onClick={onJoin}
                type="button"
              >
                Join Consultation
              </LoadingButton>
              <Link href={backHref}>
                <Button className="w-full rounded-full sm:w-auto" variant="outline">
                  Back to schedule
                </Button>
              </Link>
            </div>
            {!canJoin ? (
              <p className="mt-3 text-sm text-slate-300">
                This consultation is no longer available to join because the appointment
                is marked as {status.replace("_", " ")}.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Visit Summary</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Provider</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{providerName}</p>
              <p className="mt-1">{specialty}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Patient</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{patientName}</p>
              <p className="mt-1">{patientCode}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  Scheduled time
                </p>
                <p className="mt-2 leading-6">{formatDateTime(scheduledAt)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Clock3 className="h-4 w-4 text-sky-600" />
                  Visit reason
                </p>
                <p className="mt-2 leading-6">{reason || "General consultation"}</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
