import { cn } from "@/lib/utils"

type FormMessageProps = {
  className?: string
  message?: string
  variant?: "error" | "success"
}

const styles = {
  error: "text-[#DC2626]",
  success: "text-[#065F46]",
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
      className={cn("text-[13px]", styles[variant], className)}
      role={variant === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  )
}
