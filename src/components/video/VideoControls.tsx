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
        "h-12 rounded-full px-5",
        active
          ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
        className
      )}
      size="sm"
      variant="outline"
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
}: VideoControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ControlButton
        active={micEnabled}
        aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
        disabled={busy}
        onClick={onToggleMic}
        type="button"
      >
        {micEnabled ? (
          <Mic className="mr-2 h-4 w-4" />
        ) : (
          <MicOff className="mr-2 h-4 w-4" />
        )}
        {micEnabled ? "Mic On" : "Mic Off"}
      </ControlButton>
      <ControlButton
        active={cameraEnabled}
        aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
        disabled={busy}
        onClick={onToggleCamera}
        type="button"
      >
        {cameraEnabled ? (
          <Video className="mr-2 h-4 w-4" />
        ) : (
          <VideoOff className="mr-2 h-4 w-4" />
        )}
        {cameraEnabled ? "Camera On" : "Camera Off"}
      </ControlButton>
      <ControlButton
        active={screenSharing}
        aria-label={screenSharing ? "Stop screen sharing" : "Share your screen"}
        disabled={busy}
        onClick={onToggleScreenShare}
        type="button"
      >
        {screenSharing ? (
          <MonitorX className="mr-2 h-4 w-4" />
        ) : (
          <MonitorUp className="mr-2 h-4 w-4" />
        )}
        {screenSharing ? "Stop Share" : "Share Screen"}
      </ControlButton>
      <Button
        aria-label="Leave consultation"
        className="h-12 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800"
        disabled={busy}
        onClick={onLeave}
        type="button"
      >
        <PhoneOff className="mr-2 h-4 w-4" />
        Leave
      </Button>
    </div>
  )
}
