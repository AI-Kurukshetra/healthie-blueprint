import { cn } from "@/lib/utils"

type FormMessageProps = {
  className?: string
  message?: string
  variant?: "error" | "success"
}

const styles = {
  error: "text-rose-600",
  success: "text-emerald-600",
}

export function FormMessage({
  className,
  message,
  variant = "error",
}: FormMessageProps) {
  if (!message) {
    return null
  }

  return (
    <p
      aria-live="polite"
      className={cn("text-sm", styles[variant], className)}
      role={variant === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  )
}
