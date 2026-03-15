import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white px-3.5 py-2 text-[14px] text-[#0A1628] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-[#94A3B8] focus-visible:border-[#00D4B8] focus-visible:ring-[0_0_0_3px_rgba(0,212,184,0.12)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] aria-invalid:border-[#EF4444] aria-invalid:ring-[0_0_0_3px_rgba(239,68,68,0.1)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
