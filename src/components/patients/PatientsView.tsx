"use client"

import Link from "next/link"
import { useDeferredValue, useTransition } from "react"
import { useState } from "react"
import { Plus, Search, UserRound } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type { ProviderPatientListItem } from "@/lib/data/provider"
import { formatDate, getInitials } from "@/lib/utils"

const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const
const statusOptions = ["all", "active", "monitoring", "new"] as const

type PatientsViewProps = {
  patients: ProviderPatientListItem[]
}

export function PatientsView({ patients }: PatientsViewProps) {
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
    const matchesBloodGroup =
      bloodGroup === "all" || patient.bloodGroup === bloodGroup

    return matchesQuery && matchesStatus && matchesBloodGroup
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Patients</h2>
          <p className="mt-2 text-sm text-slate-600">
            Showing {filteredPatients.length} of {patients.length} patients.
          </p>
        </div>
        <Link href="/patients/add">
          <Button className="h-11 rounded-xl bg-sky-500 px-4 text-white hover:bg-sky-600">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="patient-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                id="patient-search"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, patient ID, or email"
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
                <SelectValue placeholder="Filter status" />
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Blood Group</label>
            <Select
              onValueChange={(value) =>
                startTransition(() => setBloodGroup(value as typeof bloodGroup))
              }
              value={bloodGroup}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Filter blood group" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group === "all" ? "All groups" : group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {filteredPatients.length === 0 ? (
        <EmptyState
          action={
            <Link href="/patients/add">
              <Button className="bg-sky-500 text-white hover:bg-sky-600">
                Add your first patient
              </Button>
            </Link>
          }
          description="Add a patient to start building your clinical roster."
          icon={<UserRound className="h-10 w-10" />}
          title="No patients yet"
        />
      ) : (
        <div className="relative">
          <FetchingOverlay isVisible={isPending || deferredQuery !== query} />

          <div className="hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm md:block">
            <Table>
              <TableHeader className="bg-slate-50">
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
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium text-slate-700">
                      {patient.patientId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage alt={patient.fullName} src={patient.avatarUrl ?? undefined} />
                          <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-950">{patient.fullName}</p>
                          <p className="text-xs text-slate-500">{patient.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{patient.age ?? "--"}</TableCell>
                    <TableCell>{patient.bloodGroup ?? "--"}</TableCell>
                    <TableCell className="max-w-52 text-wrap text-slate-600">
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
                      <div className="flex gap-2">
                        <Link href={`/patients/${patient.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                        <Link href={`/patients/${patient.id}/edit`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
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
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar size="lg">
                    <AvatarImage alt={patient.fullName} src={patient.avatarUrl ?? undefined} />
                    <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {patient.fullName}
                      </h3>
                      <StatusBadge value={patient.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{patient.patientId}</p>
                    <p className="mt-3 text-sm text-slate-600">
                      Age: {patient.age ?? "--"} | Blood group: {patient.bloodGroup ?? "--"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Conditions:{" "}
                      {patient.chronicConditions.length > 0
                        ? patient.chronicConditions.join(", ")
                        : "None listed"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link href={`/patients/${patient.id}`}>
                    <Button className="w-full" variant="outline">
                      View
                    </Button>
                  </Link>
                  <Link href={`/patients/${patient.id}/edit`}>
                    <Button className="w-full" variant="outline">
                      Edit
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
