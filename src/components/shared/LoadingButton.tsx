"use client"

import type { ComponentProps } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type LoadingButtonProps = ComponentProps<typeof Button> & {
  isLoading: boolean
  loadingText: string
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={isLoading || disabled} {...props}>
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
