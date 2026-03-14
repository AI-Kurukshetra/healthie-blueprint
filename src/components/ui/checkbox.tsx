"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  checked,
  className,
  disabled,
  onCheckedChange,
  ...props
}: Omit<React.ComponentProps<"input">, "checked" | "onChange" | "type"> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex">
      <input
        checked={checked}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white text-white transition",
          checked ? "border-sky-500 bg-sky-500" : "bg-white",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className
        )}
      >
        <Check className={cn("h-3.5 w-3.5", checked ? "opacity-100" : "opacity-0")} />
      </span>
    </label>
  )
}

export { Checkbox }
