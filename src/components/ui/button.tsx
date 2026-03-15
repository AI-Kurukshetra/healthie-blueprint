"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-transparent font-sans text-[14px] whitespace-nowrap tracking-[0.01em] transition-all duration-200 ease-out outline-none select-none active:translate-y-0 focus-visible:ring-3 focus-visible:ring-[rgba(0,212,184,0.4)] disabled:!translate-y-0 disabled:pointer-events-none disabled:!opacity-50 disabled:!shadow-none data-[loading=true]:scale-[0.98] data-[loading=true]:pointer-events-none data-[loading=true]:opacity-75 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-linear-to-br from-[#00D4B8] to-[#00B09C] text-[#0A1628] font-semibold shadow-[0_4px_15px_rgba(0,212,184,0.35)] hover:-translate-y-px hover:opacity-95 hover:shadow-[0_6px_22px_rgba(0,212,184,0.5)] active:shadow-[0_2px_8px_rgba(0,212,184,0.25)]",
        join:
          "bg-linear-to-br from-[#00D4B8] to-[#0891B2] text-white font-semibold shadow-[0_4px_20px_rgba(0,212,184,0.4)] hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(0,212,184,0.55)]",
        outline:
          "border-[1.5px] border-[rgba(0,212,184,0.4)] bg-transparent text-[#00D4B8] font-medium shadow-none hover:-translate-y-px hover:border-[#00D4B8] hover:bg-[rgba(0,212,184,0.08)]",
        secondary:
          "border border-[#E2E8F0] bg-[#F1F5F9] text-[#0A1628] font-medium shadow-none hover:-translate-y-px hover:border-[#CBD5E1] hover:bg-[#E2E8F0]",
        ghost:
          "border-[1.5px] border-[#E2E8F0] bg-transparent text-[#64748B] font-medium shadow-none hover:border-[#00D4B8] hover:bg-[rgba(0,212,184,0.04)] hover:text-[#00D4B8]",
        destructive:
          "bg-linear-to-br from-[#EF4444] to-[#DC2626] text-white font-semibold shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(239,68,68,0.45)]",
        link: "rounded-none border-transparent p-0 text-[#00D4B8] font-medium underline underline-offset-3 shadow-none hover:text-[#00B09C]",
      },
      size: {
        default: "h-11 px-5",
        xs: "h-7 px-2.5 text-[12px]",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-6",
        icon: "size-11",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
