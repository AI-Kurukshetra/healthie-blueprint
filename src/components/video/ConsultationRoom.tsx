import { Activity, CalendarDays, Clock3, ShieldCheck, UserRound } from "lucide-react"
import Link from "next/link"
import type { RefObject } from "react"

import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VideoControls } from "@/components/video/VideoControls"
import { formatDateTime, getInitials } from "@/lib/utils"

type ConsultationRoomProps = {
  backHref: string
  busy: boolean
  cameraEnabled: boolean
  hasVideoTrack: boolean
  joinedLabel: string
  micEnabled: boolean
  onLeave: () => void
  onToggleCamera: () => void
  onToggleMic: () => void
  onToggleScreenShare: () => void
  patientCode: string
  patientName: string
  permissionError: string | null
  providerName: string
  reason: string | null
  scheduledAt: string
  screenSharing: boolean
  specialty: string
  status: string
  type: string
  userRole: string
  videoRef: RefObject<HTMLVideoElement | null>
}

export function ConsultationRoom({
  backHref,
  busy,
  cameraEnabled,
  hasVideoTrack,
  joinedLabel,
  micEnabled,
  onLeave,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  patientCode,
  patientName,
  permissionError,
  providerName,
  reason,
  scheduledAt,
  screenSharing,
  specialty,
  status,
  type,
  userRole,
  videoRef,
}: ConsultationRoomProps) {
  const primaryParticipant =
    userRole === "patient"
      ? { label: "Provider", value: providerName, meta: specialty }
      : { label: "Patient", value: patientName, meta: patientCode }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Consultation in progress</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Secure video room
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Your device stream is live inside the consultation room. Adjust audio,
              video, and screen sharing from the controls below.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-emerald-50 text-emerald-700">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Connected
            </Badge>
            <StatusBadge value={status} />
            <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              {type.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 shadow-sm">
          <div className="relative aspect-video min-h-[420px]">
            {hasVideoTrack ? (
              <video
                autoPlay
                className="h-full w-full object-cover"
                muted
                playsInline
                ref={videoRef}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold">
                  {getInitials(
                    userRole === "patient" ? patientName : providerName
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">Camera currently off</h3>
                  <p className="max-w-lg text-sm leading-6 text-slate-300">
                    Turn on your camera at any time during the consultation. Audio can
                    stay active even while the video stream is paused.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <Badge className="rounded-full bg-slate-950/60 text-white backdrop-blur">
                <Activity className="mr-2 h-4 w-4 text-emerald-400" />
                {joinedLabel}
              </Badge>
              {screenSharing ? (
                <Badge className="rounded-full bg-slate-950/60 text-white backdrop-blur">
                  Screen sharing
                </Badge>
              ) : null}
              {!micEnabled ? (
                <Badge className="rounded-full bg-slate-950/60 text-white backdrop-blur">
                  Mic muted
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-900 px-5 py-4">
            <VideoControls
              busy={busy}
              cameraEnabled={cameraEnabled}
              micEnabled={micEnabled}
              onLeave={onLeave}
              onToggleCamera={onToggleCamera}
              onToggleMic={onToggleMic}
              onToggleScreenShare={onToggleScreenShare}
              screenSharing={screenSharing}
            />
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Session Snapshot</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <UserRound className="h-4 w-4 text-sky-600" />
                  {primaryParticipant.label}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {primaryParticipant.value}
                </p>
                <p className="mt-1">{primaryParticipant.meta}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <CalendarDays className="h-4 w-4 text-sky-600" />
                  Scheduled
                </p>
                <p className="mt-2 leading-6">{formatDateTime(scheduledAt)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Clock3 className="h-4 w-4 text-sky-600" />
                  Consultation reason
                </p>
                <p className="mt-2 leading-6">{reason || "General consultation"}</p>
              </div>
            </div>
          </article>

          {permissionError ? (
            <article className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900">Device access notice</h3>
              <p className="mt-3 text-sm leading-6 text-amber-800">{permissionError}</p>
            </article>
          ) : null}

          <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Exit consultation</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Leaving stops your local device stream immediately and returns you to the
              appointment workspace.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button className="rounded-full" onClick={onLeave} type="button" variant="outline">
                Leave consultation
              </Button>
              <Link href={backHref}>
                <Button className="w-full rounded-full" type="button">
                  Return to appointment
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
