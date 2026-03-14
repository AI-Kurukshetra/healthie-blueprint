"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { ConsultationRoom } from "@/components/video/ConsultationRoom"
import { WaitingRoom } from "@/components/video/WaitingRoom"

export type ConsultationExperienceSession = {
  appointment: {
    id: string
    reason: string | null
    scheduledAt: string
    status: string
    type: string
  }
  patient: {
    id: string
    patientCode: string
    patientName: string
  }
  provider: {
    id: string
    providerName: string
    specialty: string
  }
  roomId: string
  userRole: string
}

type ConsultationExperienceProps = {
  backHref: string
  session: ConsultationExperienceSession
}

function formatElapsedTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function ConsultationExperience({
  backHref,
  session,
}: ConsultationExperienceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const screenTrackRef = useRef<MediaStreamTrack | null>(null)
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [joined, setJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [joinedAt, setJoinedAt] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const canJoin =
    session.appointment.status !== "cancelled" &&
    session.appointment.status !== "completed"
  const hasVideoTrack = Boolean(previewStream?.getVideoTracks().length)

  useEffect(() => {
    if (!videoRef.current) {
      return
    }

    videoRef.current.srcObject = previewStream
  }, [previewStream])

  useEffect(() => {
    if (!joinedAt) {
      setElapsedSeconds(0)
      return
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(
          0,
          Math.floor((Date.now() - joinedAt.getTime()) / 1000)
        )
      )
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [joinedAt])

  useEffect(() => {
    return () => {
      stopTrack(audioTrackRef.current)
      stopTrack(cameraTrackRef.current)
      stopTrack(screenTrackRef.current)
    }
  }, [])

  function updatePreviewStream() {
    const tracks = [
      audioTrackRef.current,
      screenTrackRef.current ?? cameraTrackRef.current,
    ].filter((track): track is MediaStreamTrack => Boolean(track))

    setPreviewStream(tracks.length > 0 ? new MediaStream(tracks) : null)
  }

  function stopTrack(track: MediaStreamTrack | null) {
    track?.stop()
  }

  function stopAllTracks() {
    stopTrack(audioTrackRef.current)
    stopTrack(cameraTrackRef.current)
    stopTrack(screenTrackRef.current)
    audioTrackRef.current = null
    cameraTrackRef.current = null
    screenTrackRef.current = null
    setScreenSharing(false)
    setPreviewStream(null)
  }

  async function requestAudioTrack() {
    if (audioTrackRef.current) {
      return true
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError(
        "Your browser could not access a microphone on this device."
      )
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      const [track] = stream.getAudioTracks()

      if (!track) {
        return false
      }

      audioTrackRef.current = track
      updatePreviewStream()
      setPermissionError(null)
      return true
    } catch {
      setPermissionError(
        "Microphone access was blocked. You can continue without audio or allow access and try again."
      )
      return false
    }
  }

  async function requestCameraTrack() {
    if (cameraTrackRef.current) {
      return true
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError("Your browser could not access a camera on this device.")
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
        },
      })
      const [track] = stream.getVideoTracks()

      if (!track) {
        return false
      }

      cameraTrackRef.current = track
      updatePreviewStream()
      setPermissionError(null)
      return true
    } catch {
      setPermissionError(
        "Camera access was blocked. You can stay in the room with audio only and enable video later."
      )
      return false
    }
  }

  async function enableScreenShare() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setPermissionError(
        "Screen sharing is not supported in this browser."
      )
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      const [track] = stream.getVideoTracks()

      if (!track) {
        return false
      }

      screenTrackRef.current = track
      screenTrackRef.current.onended = () => {
        stopTrack(screenTrackRef.current)
        screenTrackRef.current = null
        setScreenSharing(false)
        updatePreviewStream()
      }
      setScreenSharing(true)
      updatePreviewStream()
      setPermissionError(null)
      return true
    } catch {
      setPermissionError(
        "Screen sharing was cancelled or blocked."
      )
      return false
    }
  }

  function disableScreenShare() {
    stopTrack(screenTrackRef.current)
    screenTrackRef.current = null
    setScreenSharing(false)
    updatePreviewStream()
  }

  async function handleJoin() {
    if (!canJoin) {
      return
    }

    setIsJoining(true)
    setPermissionError(null)

    try {
      if (micEnabled) {
        await requestAudioTrack()
      }

      if (cameraEnabled) {
        await requestCameraTrack()
      }

      setJoined(true)
      setJoinedAt(new Date())
    } finally {
      setIsJoining(false)
    }
  }

  function handleLeave() {
    stopAllTracks()
    setJoined(false)
    setJoinedAt(null)
    setElapsedSeconds(0)
  }

  async function handleToggleMic() {
    if (!joined) {
      setMicEnabled((current) => !current)
      return
    }

    setIsBusy(true)

    try {
      if (micEnabled) {
        stopTrack(audioTrackRef.current)
        audioTrackRef.current = null
        setMicEnabled(false)
        updatePreviewStream()
        return
      }

      const enabled = await requestAudioTrack()
      setMicEnabled(enabled)
    } finally {
      setIsBusy(false)
    }
  }

  async function handleToggleCamera() {
    if (!joined) {
      setCameraEnabled((current) => !current)
      return
    }

    setIsBusy(true)

    try {
      if (cameraEnabled) {
        stopTrack(cameraTrackRef.current)
        cameraTrackRef.current = null
        setCameraEnabled(false)
        updatePreviewStream()
        return
      }

      const enabled = await requestCameraTrack()
      setCameraEnabled(enabled)
    } finally {
      setIsBusy(false)
    }
  }

  async function handleToggleScreenShare() {
    if (!joined) {
      toast.error("Join the consultation before sharing your screen.")
      return
    }

    setIsBusy(true)

    try {
      if (screenSharing) {
        disableScreenShare()
        return
      }

      await enableScreenShare()
    } finally {
      setIsBusy(false)
    }
  }

  if (!joined) {
    return (
      <WaitingRoom
        backHref={backHref}
        cameraEnabled={cameraEnabled}
        canJoin={canJoin}
        isJoining={isJoining}
        micEnabled={micEnabled}
        onJoin={handleJoin}
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        patientCode={session.patient.patientCode}
        patientName={session.patient.patientName}
        permissionError={permissionError}
        providerName={session.provider.providerName}
        reason={session.appointment.reason}
        scheduledAt={session.appointment.scheduledAt}
        specialty={session.provider.specialty}
        status={session.appointment.status}
        type={session.appointment.type}
      />
    )
  }

  return (
    <ConsultationRoom
      backHref={backHref}
      busy={isBusy}
      cameraEnabled={cameraEnabled}
      hasVideoTrack={hasVideoTrack}
      joinedLabel={`Connected for ${formatElapsedTime(elapsedSeconds)}`}
      micEnabled={micEnabled}
      onLeave={handleLeave}
      onToggleCamera={handleToggleCamera}
      onToggleMic={handleToggleMic}
      onToggleScreenShare={handleToggleScreenShare}
      patientCode={session.patient.patientCode}
      patientName={session.patient.patientName}
      permissionError={permissionError}
      providerName={session.provider.providerName}
      reason={session.appointment.reason}
      scheduledAt={session.appointment.scheduledAt}
      screenSharing={screenSharing}
      specialty={session.provider.specialty}
      status={session.appointment.status}
      type={session.appointment.type}
      userRole={session.userRole}
      videoRef={videoRef}
    />
  )
}
