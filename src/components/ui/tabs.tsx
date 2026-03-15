"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-3 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center p-1 text-[#64748B] group-data-horizontal/tabs:h-auto group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "rounded-full border border-[#E2E8F0] bg-[#F1F5F9]",
        line: "gap-1 rounded-none border-b-2 border-[#E2E8F0] bg-transparent p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-4 py-1 text-[14px] font-medium whitespace-nowrap text-[#64748B] transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-[#0A1628] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,212,184,0.25)] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "relative inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-transparent px-4 py-1 text-[14px] font-medium whitespace-nowrap text-[#64748B] transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-[#0A1628] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,212,184,0.25)] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:data-active:bg-[var(--teal)] group-data-[variant=default]/tabs-list:data-active:text-white",
        "group-data-[variant=line]/tabs-list:h-11 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-none group-data-[variant=line]/tabs-list:px-5 group-data-[variant=line]/tabs-list:text-[#64748B] group-data-[variant=line]/tabs-list:data-active:text-[var(--teal)]",
        "group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:bottom-[-2px] group-data-[variant=line]/tabs-list:after:left-0 group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:after:w-full group-data-[variant=line]/tabs-list:after:bg-[var(--teal)] group-data-[variant=line]/tabs-list:after:opacity-0 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
