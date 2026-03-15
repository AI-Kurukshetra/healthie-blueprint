"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  label?: string
  error?: string
  minDate?: Date
  maxDate?: Date
  allowClear?: boolean
}

function parseDate(value?: string) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  label,
  error,
  minDate,
  maxDate,
  allowClear = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      ) : null}
      <div className="flex items-center gap-2">
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger
            render={
              <Button
                className={cn(
                  "h-11 w-full justify-start rounded-[10px] border-[1.5px] border-slate-200 text-left font-normal",
                  "hover:border-[#00D4B8] hover:bg-transparent",
                  "focus:border-[#00D4B8] focus:ring-2 focus:ring-[rgba(0,212,184,0.12)]",
                  !selected && "text-slate-400",
                  error && "border-red-400 focus:ring-red-100"
                )}
                variant="outline"
              />
            }
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#00D4B8]" />
            {selected ? format(selected, "dd MMM yyyy") : placeholder}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-[min(78vh,30rem)] w-[19rem] overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(10,22,40,0.18)]"
          >
            <Calendar
              className="w-full bg-white p-3"
              fixedWeeks
              classNames={{
                months: "relative flex w-full flex-col",
                month: "flex w-full flex-col gap-3",
                month_caption: "relative flex h-10 items-center justify-center px-12",
                caption_label: "text-sm leading-none font-semibold text-slate-800",
                nav: "absolute inset-x-2 top-1 z-10 flex h-8 items-center justify-between",
                button_previous:
                  "!grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white p-0 leading-none text-slate-600 shadow-sm transition-all hover:border-[#00D4B8] hover:bg-[rgba(0,212,184,0.08)] hover:text-[#00B09C] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:translate-x-[0.5px]",
                button_next:
                  "!grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white p-0 leading-none text-slate-600 shadow-sm transition-all hover:border-[#00D4B8] hover:bg-[rgba(0,212,184,0.08)] hover:text-[#00B09C] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:-translate-x-[0.5px]",
                table: "w-full border-collapse",
                weekdays: "flex",
                weekday:
                  "flex-1 text-center text-[0.8rem] font-medium text-slate-400",
                week: "mt-1 flex w-full",
                day: cn(
                  "mx-auto h-9 w-9 rounded-xl p-0 text-sm font-normal text-[#0A1628] transition-all duration-150",
                  "hover:bg-[rgba(0,212,184,0.1)] hover:text-[#00D4B8]",
                  "data-[selected-single=true]:bg-[#00D4B8] data-[selected-single=true]:font-semibold data-[selected-single=true]:text-[#0A1628]",
                  "data-[selected-single=true]:hover:bg-[#00B09C] data-[selected-single=true]:hover:text-[#0A1628]"
                ),
                today:
                  "rounded-xl border-2 border-[#00D4B8] bg-[rgba(0,212,184,0.08)] font-semibold",
                outside: "text-slate-300 opacity-50",
                disabled: "cursor-not-allowed text-slate-300 opacity-40",
              }}
              disabled={(date) => {
                const day = toStartOfDay(date)
                if (disabled?.(day)) {
                  return true
                }
                if (minDate && day < toStartOfDay(minDate)) {
                  return true
                }
                if (maxDate && day > toStartOfDay(maxDate)) {
                  return true
                }
                return false
              }}
              initialFocus
              mode="single"
              onSelect={(date) => {
                if (!date) {
                  return
                }
                onChange(toIsoDate(date))
                setOpen(false)
              }}
              selected={selected}
            />
          </PopoverContent>
        </Popover>
        {allowClear && value ? (
          <Button
            className="h-11 px-3"
            onClick={() => onChange("")}
            size="sm"
            type="button"
            variant="outline"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        ) : null}
      </div>
      {error ? <p className="mt-0.5 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
