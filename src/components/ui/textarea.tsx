import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[100px] w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white px-3.5 py-3 text-[14px] text-[#0A1628] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[#94A3B8] focus-visible:border-[#00D4B8] focus-visible:ring-[0_0_0_3px_rgba(0,212,184,0.12)] disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] aria-invalid:border-[#EF4444] aria-invalid:ring-[0_0_0_3px_rgba(239,68,68,0.1)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
