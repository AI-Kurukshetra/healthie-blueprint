"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TagsInputProps = {
  onChange: (values: string[]) => void
  placeholder?: string
  value: string[]
}

export function TagsInput({
  onChange,
  placeholder = "Type and press Enter",
  value,
}: TagsInputProps) {
  const [draft, setDraft] = useState("")

  const addTag = (rawValue: string) => {
    const nextValue = rawValue.trim()

    if (!nextValue || value.includes(nextValue)) {
      setDraft("")
      return
    }

    onChange([...value, nextValue])
    setDraft("")
  }

  return (
    <div className="space-y-3">
      <Input
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault()
            addTag(draft)
          }
        }}
        placeholder={placeholder}
        value={draft}
      />
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700"
            >
              {item}
              <Button
                className="h-5 w-5 rounded-full p-0 text-sky-700 hover:bg-sky-100"
                onClick={() => onChange(value.filter((current) => current !== item))}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {item}</span>
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
