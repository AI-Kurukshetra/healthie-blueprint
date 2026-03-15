import { Activity, ShieldCheck } from "lucide-react"
import Link from "next/link"
import type { RefObject } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VideoControls } from "@/components/video/VideoControls"
import { getInitials } from "@/lib/utils"

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
  screenSharing,
  type,
  userRole,
  videoRef,
}: ConsultationRoomProps) {
  const counterparty = userRole === "patient" ? `Dr. ${providerName}` : `${patientName} (${patientCode})`

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--navy)] text-white">
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative h-screen w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#112240] to-[#0A1628]">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
              {getInitials(counterparty)}
            </div>
            <h2 className="text-4xl font-bold text-white">{counterparty}</h2>
            <p className="mt-2 text-sm text-slate-300">{reason || "General consultation"}</p>
          </div>
        </div>

        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <Badge className="border border-white/20 bg-black/40 text-white">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-[var(--teal)]" />
            Secure
          </Badge>
          <Badge className="border border-white/20 bg-black/40 text-white">
            <Activity className="mr-1.5 h-3.5 w-3.5 text-[var(--teal)]" />
            {joinedLabel}
          </Badge>
          <Badge className="border border-white/20 bg-black/40 text-white">{type.replace("_", " ")}</Badge>
          {screenSharing ? <Badge className="border border-white/20 bg-black/40 text-white">Screen sharing</Badge> : null}
        </div>

        <div className="absolute right-6 bottom-28 z-20 h-[120px] w-[180px] overflow-hidden rounded-xl border-2 border-[var(--teal)] bg-black shadow-lg">
          {hasVideoTrack ? (
            <video
              autoPlay
              className="h-full w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-200">
              Camera off
            </div>
          )}
        </div>

        {permissionError ? (
          <div className="absolute top-4 right-4 max-w-sm rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm text-red-100">
            {permissionError}
          </div>
        ) : null}

        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
          <VideoControls
            busy={busy}
            cameraEnabled={cameraEnabled}
            micEnabled={micEnabled}
            onLeave={onLeave}
            onToggleCamera={onToggleCamera}
            onToggleMic={onToggleMic}
            onToggleScreenShare={onToggleScreenShare}
            screenSharing={screenSharing}
            timerLabel={joinedLabel.replace("Connected for ", "")}
          />
        </div>

        <div className="absolute top-4 right-4 z-30 sm:right-6 sm:top-6">
          <Link href={backHref}>
            <Button size="sm" variant="outline">
              Back
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
