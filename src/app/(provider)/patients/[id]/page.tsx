import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation"

import { LabOrderList } from "@/components/labs/LabOrderList"
import { DeletePatientButton } from "@/components/patients/DeletePatientButton"
import { EmptyState } from "@/components/shared/EmptyState"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { getPatientEHRSummary } from "@/lib/data/ehr"
import { getProviderLabOrders } from "@/lib/data/labs"
import { getPatientDetail } from "@/lib/data/provider"
import { formatDate, formatDateTime, formatRelativeTime, getInitials } from "@/lib/utils"

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [patient, ehrSummary, labOrders] = await Promise.all([
    getPatientDetail(id),
    getPatientEHRSummary(id),
    getProviderLabOrders({ patientId: id }),
  ])

  if (!patient) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--teal-dark)] transition hover:text-[var(--teal)]"
          href="/patients"
        >
          <ChevronLeft className="h-4 w-4" />
          Patients / {patient.fullName}
        </Link>
      </div>

      <section className="rounded-[20px] border border-[var(--border)] bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16" size="lg">
              <AvatarImage alt={patient.fullName} src={patient.avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-[var(--navy)]">{patient.fullName}</h1>
                <StatusBadge value={patient.status} />
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                {patient.patientId} {"  "}
                {patient.age ? `| ${patient.age} years` : ""}
                {patient.bloodGroup ? ` | Blood Group: ${patient.bloodGroup}` : ""}
              </p>
              <p className="text-sm text-[var(--text-muted)]">{patient.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="outline">Edit Patient</Button>
            </Link>
            <Link href={`/notes/new?patient=${patient.id}`}>
              <Button>Add Note</Button>
            </Link>
            <Link href={`/patients/${patient.id}/care-plan`}>
              <Button variant="outline">Care Plan</Button>
            </Link>
            <DeletePatientButton patientId={patient.id} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <h3 className="hf-card-title">Personal Info</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="hf-label">Phone</span><span>{patient.phone ?? "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">DOB</span><span>{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Gender</span><span>{patient.gender ?? "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Age</span><span>{patient.age ?? "--"}</span></div>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <h3 className="hf-card-title">Medical Summary</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="hf-label">Blood Group</span><span>{patient.bloodGroup ?? "--"}</span></div>
            <div className="space-y-1"><p className="hf-label">Allergies</p><p className="text-[var(--text-muted)]">{patient.allergies.length > 0 ? patient.allergies.join(", ") : "--"}</p></div>
            <div className="space-y-1"><p className="hf-label">Conditions</p><p className="text-[var(--text-muted)]">{patient.chronicConditions.length > 0 ? patient.chronicConditions.join(", ") : "--"}</p></div>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <h3 className="hf-card-title">Insurance & Emergency</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="hf-label">Insurance</span><span>{patient.insuranceProvider ?? "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Insurance ID</span><span>{patient.insuranceId ?? "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Emergency Contact</span><span>{patient.emergencyContact ?? "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Emergency Phone</span><span>{patient.emergencyPhone ?? "--"}</span></div>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <div className="mb-4 flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
            <h3 className="hf-card-title">Activity</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="hf-label">Last Visit</span><span>{patient.lastVisit ? formatDate(patient.lastVisit) : "--"}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Appointments</span><span>{patient.appointments.length}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Clinical Notes</span><span>{patient.notes.length}</span></div>
            <div className="flex items-center justify-between"><span className="hf-label">Messages</span><span>{patient.messages.length}</span></div>
          </div>
        </article>
      </section>

      <section className="hf-card">
        <Tabs defaultValue="overview">
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ehr">EHR</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="care-team">Care Team</TabsTrigger>
            <TabsTrigger value="care-plan">Care Plan</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent className="pt-6" value="overview">
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <article className="rounded-2xl border border-[var(--border)] bg-[#F8FAFC] p-5">
                <h3 className="hf-card-title">Health Summary</h3>
                <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                  <p>
                    Active Medications: {ehrSummary.activeMedicationCount}{" "}
                    <Link className="font-medium text-[var(--teal-dark)]" href={`/patients/${patient.id}/ehr`}>
                      Open EHR
                    </Link>
                  </p>
                  <p>
                    Last Prescription:{" "}
                    {ehrSummary.lastPrescription
                      ? `${ehrSummary.lastPrescription.rxNumber} | ${formatDate(ehrSummary.lastPrescription.issuedAt)}`
                      : "None"}
                  </p>
                </div>
              </article>

              <article className="rounded-2xl border border-[var(--border)] bg-[#F8FAFC] p-5">
                <h3 className="hf-card-title">Quick Links</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/patients/${patient.id}/ehr`}>
                    <Button variant="outline">Open EHR</Button>
                  </Link>
                  <Link href={`/patients/${patient.id}/timeline`}>
                    <Button variant="outline">Open Timeline</Button>
                  </Link>
                  <Link href={`/patients/${patient.id}/care-plan`}>
                    <Button variant="outline">Open Care Plan</Button>
                  </Link>
                </div>
              </article>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="ehr">
            <div className="rounded-2xl border border-[var(--border)] bg-[#F8FAFC] p-5">
              <h3 className="hf-card-title">Electronic Health Record</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Open the full EHR workspace to manage medications, medical history, prescriptions, and allergies for this patient.
              </p>
              <Link className="mt-4 inline-block" href={`/patients/${patient.id}/ehr`}>
                <Button variant="outline">Open EHR Workspace</Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="notes">
            {patient.notes.length === 0 ? (
              <EmptyState description="Clinical notes for this patient will appear here." title="No clinical notes yet" />
            ) : (
              <div className="space-y-3">
                {patient.notes.map((note) => (
                  <article key={note.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--navy)]">{formatDate(note.createdAt)}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {note.diagnosisCodes.length > 0 ? note.diagnosisCodes.join(", ") : "No diagnosis code"}
                        </p>
                      </div>
                      <StatusBadge value={note.status} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent className="pt-6" value="appointments">
            {patient.appointments.length === 0 ? (
              <EmptyState description="Appointments for this patient will appear here." title="No appointments yet" />
            ) : (
              <div className="space-y-3">
                {patient.appointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--navy)]">{formatDateTime(appointment.scheduledAt)}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {appointment.reason || "Consultation"} | {appointment.duration} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{appointment.type.replace("_", " ")}</Badge>
                        <StatusBadge value={appointment.status} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent className="pt-6" value="labs">
            <LabOrderList
              appointments={patient.appointments.map((appointment) => ({
                id: appointment.id,
                label: `${formatDateTime(appointment.scheduledAt)} - ${appointment.reason || "Consultation"}`,
                patientId: patient.id,
              }))}
              description="Order tests and review results linked to this patient."
              emptyDescription="Lab orders for this patient will appear here."
              emptyTitle="No labs yet"
              heading="Patient Labs"
              orderButtonLabel="Order Lab for Patient"
              orders={labOrders}
              patients={[
                {
                  id: patient.id,
                  patientId: patient.patientId,
                  patientName: patient.fullName,
                },
              ]}
              prefilledPatientId={patient.id}
            />
          </TabsContent>

          <TabsContent className="pt-6" value="messages">
            {patient.messages.length === 0 ? (
              <EmptyState description="Messages related to this patient will appear here." title="No messages yet" />
            ) : (
              <div className="space-y-3">
                {patient.messages.map((message) => (
                  <article key={message.id} className="rounded-xl border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-[var(--navy)]">{message.senderLabel}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatRelativeTime(message.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{message.content}</p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent className="pt-6" value="timeline">
            <div className="rounded-2xl border border-[var(--border)] bg-[#F8FAFC] p-5">
              <h3 className="hf-card-title">Patient Timeline</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Open the longitudinal timeline to review appointments, SOAP notes, and signed records in one place.
              </p>
              <Link className="mt-4 inline-block" href={`/patients/${patient.id}/timeline`}>
                <Button variant="outline">Open Timeline</Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="care-team">
            <div className="rounded-2xl border border-[var(--border)] bg-[#F8FAFC] p-5">
              <h3 className="hf-card-title">Care Team</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Assign specialists, consultants, and supporting providers to this patient.
              </p>
              <Link className="mt-4 inline-block" href={`/patients/${patient.id}/care-team`}>
                <Button variant="outline">Manage Care Team</Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="care-plan">
            <div className="rounded-2xl border border-[var(--border)] bg-[#F8FAFC] p-5">
              <h3 className="hf-card-title">Care Plan</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Create or update a structured treatment plan with goals, follow-up, exercise, and nutrition guidance.
              </p>
              <Link className="mt-4 inline-block" href={`/patients/${patient.id}/care-plan`}>
                <Button variant="outline">Open Care Plan</Button>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
