import { Loader2 } from "lucide-react"

export function FetchingOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) {
    return null
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[2px]">
      <div className="flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--teal)]" />
        <span className="text-sm text-[var(--text-muted)]">Updating...</span>
      </div>
    </div>
  )
}
