"use client"

import type { ComponentProps } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type LoadingButtonProps = ComponentProps<typeof Button> & {
  isLoading: boolean
  loadingText: string
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn(isLoading && "loading scale-[0.98]", className)}
      data-loading={isLoading ? "true" : undefined}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
