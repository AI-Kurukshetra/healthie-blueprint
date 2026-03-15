"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDeferredValue, useTransition } from "react"
import { useState } from "react"
import { Eye, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react"

import { DeletePatientButton } from "@/components/patients/DeletePatientButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FetchingOverlay } from "@/components/shared/FetchingOverlay"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProviderPatientListItem } from "@/lib/data/provider"
import { formatDate, getInitials } from "@/lib/utils"

const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const
const statusOptions = ["all", "active", "monitoring", "new"] as const

type PatientsViewProps = {
  patients: ProviderPatientListItem[]
}

function formatLabel(value: string, allLabel: string) {
  if (value === "all") {
    return allLabel
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

export function PatientsView({ patients }: PatientsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all")
  const [bloodGroup, setBloodGroup] = useState<(typeof bloodGroups)[number]>("all")
  const deferredQuery = useDeferredValue(query)

  const filteredPatients = patients.filter((patient) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      patient.fullName.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(deferredQuery.toLowerCase())

    const matchesStatus = status === "all" || patient.status === status
    const matchesBloodGroup = bloodGroup === "all" || patient.bloodGroup === bloodGroup

    return matchesQuery && matchesStatus && matchesBloodGroup
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="hf-page-title">Patients</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Showing {filteredPatients.length} patients
          </p>
        </div>
        <Link href="/patients/add">
          <Button>
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      <section className="hf-card">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:items-start">
            <div className="space-y-2">
            <label className="hf-label" htmlFor="patient-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--teal)]" />
              <Input
                className="h-11 pl-9"
                id="patient-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, patient ID, or email"
                value={query}
              />
            </div>
            </div>
            <div className="space-y-2">
              <label className="hf-label">Status</label>
              <Select
                onValueChange={(value) => startTransition(() => setStatus(value as typeof status))}
                value={status}
              >
                <SelectTrigger className="h-11 w-full">
                  <span className="flex flex-1 text-left">
                    {formatLabel(status, "All statuses")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatLabel(option, "All statuses")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="hf-label">Blood Group</label>
              <Select
                onValueChange={(value) =>
                  startTransition(() => setBloodGroup(value as typeof bloodGroup))
                }
                value={bloodGroup}
              >
                <SelectTrigger className="h-11 w-full">
                  <span className="flex flex-1 text-left">
                    {formatLabel(bloodGroup, "All groups")}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {formatLabel(group, "All groups")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] lg:pb-0.5">
            Showing {filteredPatients.length} patients
          </p>
        </div>
      </section>

      {filteredPatients.length === 0 ? (
        <EmptyState
          action={
            <Link href="/patients/add">
              <Button>Add Patient</Button>
            </Link>
          }
          description="Add your first patient to get started"
          icon={<UserRound className="h-12 w-12" />}
          title="No patients yet"
        />
      ) : (
        <div className="relative">
          <FetchingOverlay isVisible={isPending || deferredQuery !== query} />

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Conditions</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    aria-label={`Open ${patient.fullName}`}
                    className="cursor-pointer"
                    onClick={() => router.push(`/patients/${patient.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        router.push(`/patients/${patient.id}`)
                      }
                    }}
                    role="link"
                    tabIndex={0}
                  >
                    <TableCell className="font-mono text-sm font-semibold text-[var(--teal-dark)]">
                      {patient.patientId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage alt={patient.fullName} src={patient.avatarUrl ?? undefined} />
                          <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-[var(--navy)]">{patient.fullName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{patient.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{patient.age ?? "--"}</TableCell>
                    <TableCell>{patient.bloodGroup ?? "--"}</TableCell>
                    <TableCell className="max-w-52 text-wrap text-[var(--text-muted)]">
                      {patient.chronicConditions.length > 0
                        ? patient.chronicConditions.join(", ")
                        : "--"}
                    </TableCell>
                    <TableCell>
                      {patient.lastVisit ? formatDate(patient.lastVisit) : "--"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={patient.status} />
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-1"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Link href={`/patients/${patient.id}`}>
                          <Button size="icon-xs" title="View" variant="ghost">
                            <Eye className="h-4 w-4 text-[var(--navy)]" />
                          </Button>
                        </Link>
                        <Link href={`/patients/${patient.id}/edit`}>
                          <Button size="icon-xs" title="Edit" variant="ghost">
                            <Pencil className="h-4 w-4 text-amber-500" />
                          </Button>
                        </Link>
                        <DeletePatientButton
                          patientId={patient.id}
                          triggerLabel={
                            <Button size="icon-xs" title="Delete" variant="ghost">
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4 md:hidden">
            {filteredPatients.map((patient) => (
              <article
                key={patient.id}
                aria-label={`Open ${patient.fullName}`}
                className="cursor-pointer rounded-xl border border-[#E2E8F0] border-l-4 border-l-[var(--teal)] bg-white p-4"
                onClick={() => router.push(`/patients/${patient.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    router.push(`/patients/${patient.id}`)
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--navy)]">{patient.fullName}</h3>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{patient.patientId}</p>
                  </div>
                  <StatusBadge value={patient.status} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(patient.chronicConditions.length > 0
                    ? patient.chronicConditions
                    : ["No conditions listed"]
                  ).map((condition) => (
                    <Badge key={`${patient.id}-${condition}`} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>

                <div
                  className="mt-4 flex justify-end gap-1"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Link href={`/patients/${patient.id}`}>
                    <Button size="icon-xs" title="View" variant="ghost">
                      <Eye className="h-4 w-4 text-[var(--navy)]" />
                    </Button>
                  </Link>
                  <Link href={`/patients/${patient.id}/edit`}>
                    <Button size="icon-xs" title="Edit" variant="ghost">
                      <Pencil className="h-4 w-4 text-amber-500" />
                    </Button>
                  </Link>
                  <DeletePatientButton
                    patientId={patient.id}
                    triggerLabel={
                      <Button size="icon-xs" title="Delete" variant="ghost">
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
