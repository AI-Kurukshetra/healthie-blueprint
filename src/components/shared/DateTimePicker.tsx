"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateTimePickerProps = {
  value?: string
  onChange: (dateTime: string) => void
  onDateChange?: (date: string) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  label?: string
  error?: string
  minDate?: Date
  maxDate?: Date
  bookedSlots?: string[]
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

function buildTimeSlots() {
  const slots: string[] = []
  for (let total = 9 * 60; total <= 18 * 60; total += 30) {
    const hours = Math.floor(total / 60)
    const minutes = total % 60
    slots.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`)
  }
  return slots
}

function formatSlot(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const suffix = hours >= 12 ? "PM" : "AM"
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`
}

export function DateTimePicker({
  value,
  onChange,
  onDateChange,
  placeholder = "Pick a date and time",
  disabled,
  label,
  error,
  minDate,
  maxDate,
  bookedSlots = [],
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [draftDate, setDraftDate] = useState<string | undefined>(undefined)
  const [draftTime, setDraftTime] = useState<string | undefined>(undefined)

  const [selectedDateFromValue, selectedTimeFromValue] = value ? value.split("T") : []
  const selectedDate = draftDate ?? selectedDateFromValue
  const selectedTime = draftTime ?? selectedTimeFromValue
  const selectedDay = parseDate(selectedDate)
  const slots = useMemo(() => buildTimeSlots(), [])

  const hasCompleteSelection = Boolean(selectedDate && selectedTime)
  const triggerLabel = hasCompleteSelection
    ? `${format(parseDate(selectedDate)!, "dd MMM yyyy")}, ${formatSlot(selectedTime!)}`
    : selectedDate
      ? `${format(parseDate(selectedDate)!, "dd MMM yyyy")} - Select time`
      : placeholder

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
      ) : null}
      <Popover
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setDraftDate(undefined)
            setDraftTime(undefined)
          }
        }}
        open={open}
      >
        <PopoverTrigger
          render={
            <Button
              className={cn(
                "h-11 w-full justify-start rounded-[10px] border-[1.5px] border-slate-200 text-left font-normal",
                "hover:border-[#00D4B8] hover:bg-transparent",
                "focus:border-[#00D4B8] focus:ring-2 focus:ring-[rgba(0,212,184,0.12)]",
                !hasCompleteSelection && "text-slate-400",
                error && "border-red-400 focus:ring-red-100"
              )}
              variant="outline"
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#00D4B8]" />
          {triggerLabel}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="max-h-[min(78vh,42rem)] w-[min(26rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_20px_60px_rgba(10,22,40,0.18)]"
        >
          <div className="p-3">
            <Calendar
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
                const isoDate = toIsoDate(date)
                setDraftDate(isoDate)
                setDraftTime(undefined)
                onDateChange?.(isoDate)
              }}
              selected={selectedDay}
            />
          </div>

          <div className="border-t border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Select Time
            </p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => {
                const activeDate = draftDate ?? selectedDateFromValue
                const isSelected = selectedTime === slot
                const isBooked = bookedSlots.includes(slot)
                const isPastInCurrentDay = Boolean(activeDate) && (() => {
                  const now = new Date()
                  const slotDateTime = new Date(`${activeDate}T${slot}:00`)
                  return slotDateTime <= now
                })()
                const isDisabled = !activeDate || isBooked || isPastInCurrentDay

                return (
                  <button
                    key={slot}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition-all",
                      isSelected
                        ? "border-[#00D4B8] bg-[#00D4B8] font-semibold text-[#0A1628]"
                        : isDisabled
                          ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#00D4B8] hover:bg-[rgba(0,212,184,0.1)] hover:text-[#00D4B8]"
                    )}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!activeDate) {
                        return
                      }
                      setDraftTime(slot)
                      onChange(`${activeDate}T${slot}`)
                      setOpen(false)
                    }}
                    type="button"
                  >
                    {formatSlot(slot)}
                  </button>
                )
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {error ? <p className="mt-0.5 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
