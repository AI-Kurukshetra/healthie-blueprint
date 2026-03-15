import { CalendarDays, Clock3, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { LoadingButton } from "@/components/shared/LoadingButton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime, getInitials } from "@/lib/utils"

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
    <div className="relative min-h-screen overflow-hidden bg-[var(--navy)] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,212,184,0.12)_1px,_transparent_1px)] bg-[length:24px_24px]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl rounded-[20px] border border-[var(--navy-border)] bg-[var(--navy-light)] p-8 shadow-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/10 text-white">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Secure session
            </Badge>
            <StatusBadge value={status} />
            <Badge className="bg-white/10 text-white">{type.replace("_", " ")}</Badge>
          </div>

          <div className="mt-8 flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--teal-light)] text-2xl font-bold text-[var(--teal)]">
              <span className="absolute inset-0 rounded-full border border-[var(--teal)]/40 animate-ping" />
              <span className="absolute inset-2 rounded-full border border-[var(--teal)]/30" />
              <span className="relative z-10">{getInitials(providerName)}</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Waiting for Dr. {providerName}...</h1>
            <p className="mt-2 text-sm text-slate-300">connecting...</p>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl border border-[var(--navy-border)] bg-[rgba(255,255,255,0.03)] p-5 md:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-300">
              <p className="inline-flex items-center gap-2 text-white">
                <CalendarDays className="h-4 w-4 text-[var(--teal)]" />
                Scheduled
              </p>
              <p>{formatDateTime(scheduledAt)}</p>
              <p className="text-xs">{specialty}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="inline-flex items-center gap-2 text-white">
                <Clock3 className="h-4 w-4 text-[var(--teal)]" />
                Visit
              </p>
              <p>{reason || "General consultation"}</p>
              <p className="text-xs">{patientName} ({patientCode})</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Button onClick={onToggleMic} type="button" variant={micEnabled ? "outline" : "destructive"}>
              {micEnabled ? "Mic On" : "Mic Off"}
            </Button>
            <Button onClick={onToggleCamera} type="button" variant={cameraEnabled ? "outline" : "destructive"}>
              {cameraEnabled ? "Cam On" : "Cam Off"}
            </Button>
          </div>

          {permissionError ? <p className="mt-4 hf-alert-error">{permissionError}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <LoadingButton
              className="w-full sm:w-auto"
              disabled={!canJoin}
              isLoading={isJoining}
              loadingText="Joining..."
              onClick={onJoin}
              type="button"
              variant="join"
            >
              Join Consultation
            </LoadingButton>
            <Link href={backHref}>
              <Button className="w-full sm:w-auto" variant="outline">Back</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
