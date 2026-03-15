"use client"

import type { ComponentProps } from "react"
import {
  Mic,
  MicOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type VideoControlsProps = {
  busy?: boolean
  cameraEnabled: boolean
  micEnabled: boolean
  onLeave: () => void
  onToggleCamera: () => void
  onToggleMic: () => void
  onToggleScreenShare: () => void
  screenSharing: boolean
  timerLabel: string
}

function ControlButton({
  active,
  children,
  className,
  ...props
}: ComponentProps<typeof Button> & { active: boolean }) {
  return (
    <Button
      className={cn(
        "size-12 rounded-full border border-white/15 bg-[rgba(10,22,40,0.8)] p-0 text-white hover:bg-[rgba(17,34,64,0.95)]",
        !active && "border-red-400/50 bg-red-500 text-white hover:bg-red-600",
        className
      )}
      size="icon"
      variant="ghost"
      {...props}
    >
      {children}
    </Button>
  )
}

export function VideoControls({
  busy = false,
  cameraEnabled,
  micEnabled,
  onLeave,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  screenSharing,
  timerLabel,
}: VideoControlsProps) {
  return (
    <div className="inline-flex items-end gap-4 rounded-full border border-white/10 bg-[rgba(10,22,40,0.8)] px-5 py-3 backdrop-blur-xl">
      <ControlButton
        active={micEnabled}
        aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
        disabled={busy}
        onClick={onToggleMic}
        type="button"
      >
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </ControlButton>

      <ControlButton
        active={cameraEnabled}
        aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
        disabled={busy}
        onClick={onToggleCamera}
        type="button"
      >
        {cameraEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </ControlButton>

      <p className="pb-3 font-mono text-sm font-semibold text-[var(--teal)]">{timerLabel}</p>

      <ControlButton
        active={screenSharing}
        aria-label={screenSharing ? "Stop screen sharing" : "Share your screen"}
        disabled={busy}
        onClick={onToggleScreenShare}
        type="button"
      >
        {screenSharing ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
      </ControlButton>

      <div className="flex flex-col items-center gap-1">
        <Button
          aria-label="End consultation"
          className="size-14 rounded-full bg-linear-to-br from-[#EF4444] to-[#DC2626] text-white hover:opacity-90"
          disabled={busy}
          onClick={onLeave}
          size="icon"
          type="button"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
        <span className="text-[11px] text-white/90">End</span>
      </div>
    </div>
  )
}
