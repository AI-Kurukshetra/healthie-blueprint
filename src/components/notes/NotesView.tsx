"use client"

import Link from "next/link"
import { useDeferredValue, useState, useTransition } from "react"
import { FilePlus2, Search } from "lucide-react"

import { FetchingOverlay } from "@/components/shared/FetchingOverlay"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { NoteListItem } from "@/lib/data/notes"
import { formatDate } from "@/lib/utils"

const statusOptions = ["all", "draft", "signed"] as const

type NotesViewProps = {
  notes: NoteListItem[]
}

export function NotesView({ notes }: NotesViewProps) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all")
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)

  const filteredNotes = notes.filter((note) => {
    const queryMatches =
      deferredQuery.trim().length === 0 ||
      note.patientName.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      note.patientId.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      note.diagnosisCodes.join(" ").toLowerCase().includes(deferredQuery.toLowerCase())

    const statusMatches = status === "all" || note.status === status

    return queryMatches && statusMatches
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Clinical Notes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review and complete SOAP notes across your patient roster.
          </p>
        </div>
        <Link href="/notes/new">
          <Button className="h-11 rounded-xl bg-sky-500 px-4 text-white hover:bg-sky-600">
            <FilePlus2 className="h-4 w-4" />
            Create Note
          </Button>
        </Link>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="note-search">
              Search patient or diagnosis
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                id="note-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes"
                value={query}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Status</label>
            <Select
              onValueChange={(value) => startTransition(() => setStatus(value as typeof status))}
              value={status}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === "all" ? "All statuses" : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {filteredNotes.length === 0 ? (
        <EmptyState
          action={
            <Link href="/notes/new">
              <Button className="bg-sky-500 text-white hover:bg-sky-600">
                Create your first note
              </Button>
            </Link>
          }
          description="SOAP notes will appear here after they are created."
          title="No notes found"
        />
      ) : (
        <div className="relative">
          <FetchingOverlay isVisible={isPending || deferredQuery !== query} />
          <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm md:block">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Diagnosis Codes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>{formatDate(note.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-950">{note.patientName}</p>
                        <p className="text-xs text-slate-500">{note.patientId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{note.type}</TableCell>
                    <TableCell className="max-w-56 text-wrap text-slate-600">
                      {note.diagnosisCodes.length > 0
                        ? note.diagnosisCodes.join(", ")
                        : "No diagnosis code"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={note.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/notes/${note.id}`}>
                        <Button size="sm" variant="outline">
                          {note.status === "signed" ? "View" : "Open"}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{note.patientName}</h3>
                    <p className="text-sm text-slate-500">{note.patientId}</p>
                  </div>
                  <StatusBadge value={note.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {note.diagnosisCodes.length > 0
                    ? note.diagnosisCodes.join(", ")
                    : "No diagnosis code"}
                </p>
                <div className="mt-4">
                  <Link href={`/notes/${note.id}`}>
                    <Button className="w-full" variant="outline">
                      {note.status === "signed" ? "View Note" : "Open Note"}
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
