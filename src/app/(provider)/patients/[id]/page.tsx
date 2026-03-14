import Link from "next/link"
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
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar size="lg">
              <AvatarImage alt={patient.fullName} src={patient.avatarUrl ?? undefined} />
              <AvatarFallback>{getInitials(patient.fullName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-950">
                  {patient.fullName}
                </h2>
                <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  {patient.patientId}
                </Badge>
                <StatusBadge value={patient.status} />
              </div>
              <p className="text-sm text-slate-600">{patient.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/patients/${patient.id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
            <Link href={`/notes/new?patient=${patient.id}`}>
              <Button variant="outline">Add Note</Button>
            </Link>
            <Link href={`/appointments?patient=${patient.id}`}>
              <Button variant="outline">Open Appointments</Button>
            </Link>
            <Link href={`/patients/${patient.id}/ehr`}>
              <Button variant="outline">Open EHR</Button>
            </Link>
            <DeletePatientButton patientId={patient.id} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Personal Info</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Phone: {patient.phone ?? "--"}</p>
            <p>DOB: {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "--"}</p>
            <p>Gender: {patient.gender ?? "--"}</p>
            <p>Age: {patient.age ?? "--"}</p>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Medical Summary</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Blood group: {patient.bloodGroup ?? "--"}</p>
            <p>
              Allergies: {patient.allergies.length > 0 ? patient.allergies.join(", ") : "--"}
            </p>
            <p>
              Conditions:{" "}
              {patient.chronicConditions.length > 0
                ? patient.chronicConditions.join(", ")
                : "--"}
            </p>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Insurance & Emergency</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Insurance: {patient.insuranceProvider ?? "--"}</p>
            <p>Insurance ID: {patient.insuranceId ?? "--"}</p>
            <p>Emergency contact: {patient.emergencyContact ?? "--"}</p>
            <p>Emergency phone: {patient.emergencyPhone ?? "--"}</p>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Activity</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Last visit: {patient.lastVisit ? formatDate(patient.lastVisit) : "--"}</p>
            <p>Appointments: {patient.appointments.length}</p>
            <p>Clinical notes: {patient.notes.length}</p>
            <p>Messages: {patient.messages.length}</p>
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
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
              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-950">Health Summary</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p>
                    Active Medications: {ehrSummary.activeMedicationCount}{" "}
                    <Link className="font-medium text-sky-600" href={`/patients/${patient.id}/ehr`}>
                      Open EHR
                    </Link>
                  </p>
                  <div className="space-y-2">
                    <p>Known Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.length > 0 ? (
                        patient.allergies.map((item) => (
                          <Badge
                            key={item}
                            className="rounded-full border border-rose-200 bg-rose-50 text-rose-700"
                          >
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-slate-500">None</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p>Chronic Conditions</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.chronicConditions.length > 0 ? (
                        patient.chronicConditions.map((item) => (
                          <Badge
                            key={item}
                            className="rounded-full border border-amber-200 bg-amber-50 text-amber-700"
                          >
                            {item}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-slate-500">None</p>
                      )}
                    </div>
                  </div>
                  <p>
                    Last Prescription:{" "}
                    {ehrSummary.lastPrescription
                      ? `${ehrSummary.lastPrescription.rxNumber} • ${formatDate(ehrSummary.lastPrescription.issuedAt)}`
                      : "None"}
                  </p>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-950">Quick Links</h3>
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
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-950">Electronic Health Record</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Open the full EHR workspace to manage medications, medical history,
                prescriptions, and allergies for this patient.
              </p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                href={`/patients/${patient.id}/ehr`}
              >
                Open EHR Workspace
              </Link>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="notes">
            {patient.notes.length === 0 ? (
              <EmptyState
                description="Clinical notes for this patient will appear here."
                title="No clinical notes yet"
              />
            ) : (
              <div className="space-y-3">
                {patient.notes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {formatDate(note.createdAt)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {note.diagnosisCodes.length > 0
                            ? note.diagnosisCodes.join(", ")
                            : "No diagnosis code"}
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
              <EmptyState
                description="Appointments for this patient will appear here."
                title="No appointments yet"
              />
            ) : (
              <div className="space-y-3">
                {patient.appointments.map((appointment) => (
                  <article
                    key={appointment.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-950">
                          {formatDateTime(appointment.scheduledAt)}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {appointment.reason || "Consultation"} | {appointment.duration} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                          {appointment.type.replace("_", " ")}
                        </Badge>
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
                label: `${formatDateTime(appointment.scheduledAt)} - ${
                  appointment.reason || "Consultation"
                }`,
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
              <EmptyState
                description="Messages related to this patient will appear here."
                title="No messages yet"
              />
            ) : (
              <div className="space-y-3">
                {patient.messages.map((message) => (
                  <article
                    key={message.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">{message.senderLabel}</p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeTime(message.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {message.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent className="pt-6" value="timeline">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-950">Patient Timeline</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Open the longitudinal timeline to review appointments, SOAP notes, and
                signed records in one place.
              </p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                href={`/patients/${patient.id}/timeline`}
              >
                Open Timeline
              </Link>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="care-team">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-950">Care Team</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Assign specialists, consultants, and supporting providers to this patient.
              </p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                href={`/patients/${patient.id}/care-team`}
              >
                Manage Care Team
              </Link>
            </div>
          </TabsContent>

          <TabsContent className="pt-6" value="care-plan">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-950">Care Plan</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Create or update a structured treatment plan with goals, follow-up,
                exercise, and nutrition guidance.
              </p>
              <Link
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
                href={`/patients/${patient.id}/care-plan`}
              >
                Open Care Plan
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
