"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { formatDate, formatTime } from "@/lib/utils"
import {
  appointmentDeclineSchema,
  appointmentSchema,
  cancelAppointmentSchema,
} from "@/lib/validations/appointment"

type AppointmentActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  success?: boolean
}

const ACTIVE_APPOINTMENT_STATUSES = ["scheduled", "confirmed", "in_progress"] as const
const APPOINTMENT_NOTIFICATION_PATHS = [
  "/appointments",
  "/dashboard",
  "/portal",
  "/portal/appointments",
]

const optionalUuid = (message: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return undefined
      }
      return value
    },
    z.string().uuid(message).optional()
  )

const appointmentBookingSchema = appointmentSchema.omit({ patient_id: true }).extend({
  patient_id: optionalUuid("Select a patient"),
  provider_id: optionalUuid("Select a provider"),
})

const bookedSlotsSchema = z.object({
  appointment_date: z.string().min(1, "Select a date"),
  duration: z.number().min(15).max(120),
  patient_id: optionalUuid("Select a patient"),
  provider_id: optionalUuid("Select a provider"),
  slot_duration: z.number().min(15).max(120),
})

type AppointmentActor =
  | {
      patientId: string
      role: "patient"
      userId: string
    }
  | {
      providerId: string
      role: "provider"
      userId: string
    }

type ActiveAppointment = {
  duration: number
  id: string
  patient_id: string
  provider_id: string
  scheduled_at: string
  status: string
}

type AppointmentConflictCheck = {
  patientConflict: boolean
  providerConflict: boolean
}

type AppointmentParticipantContext = {
  patientId: string
  patientName: string
  patientProfileId: string
  providerId: string
  providerName: string
  providerProfileId: string
  providerSpecialty: string
}

type AppointmentContext = AppointmentParticipantContext & {
  bookedBy: "patient" | "provider"
  cancelReason: string | null
  duration: number
  id: string
  meetingRoomId: string | null
  reason: string | null
  scheduledAt: string
  status: string
  type: string
}

function normalizeAppointmentInput(input: unknown) {
  return typeof input === "string" ? { appointment_id: input } : input
}

function formatProviderNotificationName(name: string) {
  return /^dr\.?\s/i.test(name) || /^dr\.?$/i.test(name) ? name : `Dr. ${name}`
}

function toIsoDateTime(date: string, time: string) {
  const scheduledAt = new Date(`${date}T${time}:00`)

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid appointment time.")
  }

  return scheduledAt.toISOString()
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

function getDayRange(date: string) {
  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59.999`)

  return {
    dayEnd: dayEnd.toISOString(),
    dayStart: dayStart.toISOString(),
  }
}

function appointmentsOverlap(
  existingScheduledAt: string,
  existingDuration: number,
  nextStart: Date,
  nextEnd: Date
) {
  const existingStart = new Date(existingScheduledAt)
  const existingEnd = addMinutes(existingStart, existingDuration)

  return existingStart < nextEnd && existingEnd > nextStart
}

function revalidateAppointmentPaths(appointmentId?: string) {
  for (const path of APPOINTMENT_NOTIFICATION_PATHS) {
    revalidatePath(path)
  }

  if (appointmentId) {
    revalidatePath(`/appointments/${appointmentId}`)
  }
}

async function insertNotification({
  link,
  message,
  title,
  type = "appointment",
  userId,
}: {
  link: string | null
  message: string
  title: string
  type?: string
  userId: string
}) {
  const admin = createAdminClient()
  const { error } = await admin.from("notifications").insert({
    link,
    message,
    title,
    type,
    user_id: userId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function getCurrentAppointmentActor(): Promise<AppointmentActor> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (providerError) {
    throw new Error("Unauthorized")
  }

  if (provider) {
    return {
      providerId: provider.id,
      role: "provider",
      userId: user.id,
    }
  }

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (patientError || !patient) {
    throw new Error("Unauthorized")
  }

  return {
    patientId: patient.id,
    role: "patient",
    userId: user.id,
  }
}

async function getActiveAppointmentsForDate({
  patientId,
  providerId,
  date,
}: {
  date: string
  patientId?: string
  providerId?: string
}) {
  const admin = createAdminClient()
  const { dayEnd, dayStart } = getDayRange(date)
  let query = admin
    .from("appointments")
    .select("duration, id, patient_id, provider_id, scheduled_at, status")
    .in("status", [...ACTIVE_APPOINTMENT_STATUSES])
    .gte("scheduled_at", dayStart)
    .lt("scheduled_at", dayEnd)

  if (providerId) {
    query = query.eq("provider_id", providerId)
  }

  if (patientId) {
    query = query.eq("patient_id", patientId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ActiveAppointment[]
}

async function getAppointmentParticipants({
  patientId,
  providerId,
}: {
  patientId: string
  providerId: string
}): Promise<AppointmentParticipantContext | null> {
  const admin = createAdminClient()
  const [{ data: patient, error: patientError }, { data: provider, error: providerError }] =
    await Promise.all([
      admin
        .from("patients")
        .select("id, profile_id")
        .eq("id", patientId)
        .maybeSingle(),
      admin
        .from("providers")
        .select("id, profile_id, specialty")
        .eq("id", providerId)
        .maybeSingle(),
    ])

  if (patientError) {
    throw new Error(patientError.message)
  }

  if (providerError) {
    throw new Error(providerError.message)
  }

  if (!patient || !provider) {
    return null
  }

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [patient.profile_id, provider.profile_id])

  if (profilesError) {
    throw new Error(profilesError.message)
  }

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name ?? "Care team member"])
  )

  return {
    patientId: patient.id,
    patientName: profileMap.get(patient.profile_id) ?? "Patient",
    patientProfileId: patient.profile_id,
    providerId: provider.id,
    providerName: profileMap.get(provider.profile_id) ?? "Provider",
    providerProfileId: provider.profile_id,
    providerSpecialty: provider.specialty,
  }
}

async function getAppointmentContext(
  appointmentId: string
): Promise<AppointmentContext | null> {
  const admin = createAdminClient()
  const { data: appointment, error } = await admin
    .from("appointments")
    .select(
      "booked_by, cancel_reason, duration, id, meeting_room_id, patient_id, provider_id, reason, scheduled_at, status, type"
    )
    .eq("id", appointmentId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!appointment) {
    return null
  }

  const participants = await getAppointmentParticipants({
    patientId: appointment.patient_id,
    providerId: appointment.provider_id,
  })

  if (!participants) {
    return null
  }

  return {
    ...participants,
    bookedBy: appointment.booked_by as "patient" | "provider",
    cancelReason: appointment.cancel_reason,
    duration: appointment.duration,
    id: appointment.id,
    meetingRoomId: appointment.meeting_room_id,
    reason: appointment.reason,
    scheduledAt: appointment.scheduled_at,
    status: appointment.status,
    type: appointment.type,
  }
}

async function updateAppointmentStatus({
  appointmentId,
  values,
}: {
  appointmentId: string
  values: Record<string, string | null>
}) {
  const admin = createAdminClient()
  const { error } = await admin.from("appointments").update(values).eq("id", appointmentId)

  if (error) {
    throw new Error(error.message)
  }
}

async function checkAppointmentConflicts({
  appointmentDate,
  duration,
  patientId,
  providerId,
  scheduledAt,
}: {
  appointmentDate: string
  duration: number
  patientId: string
  providerId: string
  scheduledAt: string
}): Promise<AppointmentConflictCheck> {
  const nextStart = new Date(scheduledAt)
  const nextEnd = addMinutes(nextStart, duration)
  const [patientAppointments, providerAppointments] = await Promise.all([
    getActiveAppointmentsForDate({
      date: appointmentDate,
      patientId,
    }),
    getActiveAppointmentsForDate({
      date: appointmentDate,
      providerId,
    }),
  ])

  return {
    patientConflict: patientAppointments.some((appointment) =>
      appointmentsOverlap(appointment.scheduled_at, appointment.duration, nextStart, nextEnd)
    ),
    providerConflict: providerAppointments.some((appointment) =>
      appointmentsOverlap(appointment.scheduled_at, appointment.duration, nextStart, nextEnd)
    ),
  }
}

function buildTimeSlots(slotDuration: number) {
  const slots: string[] = []

  for (let hour = 9; hour < 17; hour += 1) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      if (hour === 16 && minute > 0) {
        continue
      }

      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      )
    }
  }

  return slots
}

function getBookedSlotTimes({
  appointments,
  appointmentDate,
  duration,
  slotDuration,
}: {
  appointmentDate: string
  appointments: ActiveAppointment[]
  duration: number
  slotDuration: number
}) {
  return buildTimeSlots(slotDuration).filter((slot) => {
    const slotStart = new Date(`${appointmentDate}T${slot}:00`)
    const slotEnd = addMinutes(slotStart, duration)

    return appointments.some((appointment) =>
      appointmentsOverlap(appointment.scheduled_at, appointment.duration, slotStart, slotEnd)
    )
  })
}

export async function createAppointmentAction(
  input: unknown
): Promise<AppointmentActionResult> {
  const parsed = appointmentBookingSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const values = parsed.data
  const actor = await getCurrentAppointmentActor()
  const bookedBy: "patient" | "provider" =
    actor.role === "patient" || Boolean(values.provider_id) ? "patient" : "provider"
  const providerId = actor.role === "provider" ? actor.providerId : values.provider_id
  const patientId = actor.role === "patient" ? actor.patientId : values.patient_id

  if (!providerId) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: {
        provider_id: ["Select a provider"],
      },
    }
  }

  if (!patientId) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: {
        patient_id: ["Select a patient"],
      },
    }
  }

  const scheduledAt = toIsoDateTime(values.appointment_date, values.appointment_time)

  if (new Date(scheduledAt) <= new Date()) {
    return {
      error: "Appointment time must be in the future.",
    }
  }

  const conflicts = await checkAppointmentConflicts({
    appointmentDate: values.appointment_date,
    duration: values.duration,
    patientId,
    providerId,
    scheduledAt,
  })

  if (conflicts.patientConflict) {
    return {
      error:
        "Patient already has an appointment at this time. Please choose a different slot.",
    }
  }

  if (conflicts.providerConflict) {
    return {
      error:
        "This time slot is no longer available. Please choose a different slot.",
    }
  }

  const participants = await getAppointmentParticipants({
    patientId,
    providerId,
  })

  if (!participants) {
    return {
      error: "Unable to load appointment participants.",
    }
  }

  const admin = createAdminClient()
  const { error } = await admin.from("appointments").insert({
    booked_by: bookedBy,
    duration: values.duration,
    meeting_room_id: values.type === "video" ? `consult-${crypto.randomUUID()}` : null,
    patient_id: patientId,
    provider_id: providerId,
    reason: values.reason,
    scheduled_at: scheduledAt,
    status: "scheduled",
    type: values.type,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  try {
    if (bookedBy === "provider") {
      await insertNotification({
        link: "/portal/appointments",
        message: `${formatProviderNotificationName(participants.providerName)} scheduled an appointment for you on ${formatDate(scheduledAt)} at ${formatTime(scheduledAt)}. Please confirm.`,
        title: "Appointment Scheduled for You",
        userId: participants.patientProfileId,
      })
    } else {
      await insertNotification({
        link: "/appointments",
        message: `${participants.patientName} requested an appointment on ${formatDate(scheduledAt)} at ${formatTime(scheduledAt)}. Please review.`,
        title: "New Appointment Request",
        userId: participants.providerProfileId,
      })
    }
  } catch (notificationError) {
    return {
      error:
        notificationError instanceof Error
          ? notificationError.message
          : "Appointment was created, but the notification could not be sent.",
    }
  }

  revalidateAppointmentPaths()

  return {
    success: true,
  }
}

export async function getBookedSlotsAction(input: unknown): Promise<{
  bookedSlots?: string[]
  error?: string
}> {
  const parsed = bookedSlotsSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Unable to load booked slots.",
    }
  }

  try {
    const actor = await getCurrentAppointmentActor()
    const providerId =
      actor.role === "provider" ? actor.providerId : parsed.data.provider_id
    const patientId = actor.role === "patient" ? actor.patientId : parsed.data.patient_id

    if (!providerId) {
      return {
        bookedSlots: [],
      }
    }

    const [providerAppointments, patientAppointments] = await Promise.all([
      getActiveAppointmentsForDate({
        date: parsed.data.appointment_date,
        providerId,
      }),
      patientId
        ? getActiveAppointmentsForDate({
            date: parsed.data.appointment_date,
            patientId,
          })
        : Promise.resolve([]),
    ])

    const uniqueAppointments = new Map<string, ActiveAppointment>()

    for (const appointment of [...providerAppointments, ...patientAppointments]) {
      uniqueAppointments.set(appointment.id, appointment)
    }

    return {
      bookedSlots: getBookedSlotTimes({
        appointmentDate: parsed.data.appointment_date,
        appointments: [...uniqueAppointments.values()],
        duration: parsed.data.duration,
        slotDuration: parsed.data.slot_duration,
      }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to load booked slots.",
    }
  }
}

export async function confirmAppointmentByPatientAction(
  input: unknown
): Promise<AppointmentActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(normalizeAppointmentInput(input))

  if (!parsed.success) {
    return {
      error: "Invalid appointment.",
    }
  }

  const actor = await getCurrentAppointmentActor()

  if (actor.role !== "patient") {
    return {
      error: "Unauthorized",
    }
  }

  const appointment = await getAppointmentContext(parsed.data.appointment_id)

  if (!appointment || appointment.patientId !== actor.patientId) {
    return {
      error: "Appointment not found.",
    }
  }

  if (appointment.status !== "scheduled" || appointment.bookedBy !== "provider") {
    return {
      error: "This appointment is no longer awaiting your confirmation.",
    }
  }

  await updateAppointmentStatus({
    appointmentId: appointment.id,
    values: {
      status: "confirmed",
    },
  })

  await insertNotification({
    link: "/appointments",
    message: `${appointment.patientName} confirmed their appointment on ${formatDate(appointment.scheduledAt)} at ${formatTime(appointment.scheduledAt)}.`,
    title: "Appointment Confirmed by Patient",
    userId: appointment.providerProfileId,
  })

  revalidateAppointmentPaths(appointment.id)

  return {
    success: true,
  }
}

export async function declineAppointmentByPatientAction(
  input: unknown
): Promise<AppointmentActionResult> {
  const parsed = appointmentDeclineSchema.safeParse(
    typeof input === "string" ? { appointment_id: input } : input
  )

  if (!parsed.success) {
    return {
      error: "Invalid appointment.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const actor = await getCurrentAppointmentActor()

  if (actor.role !== "patient") {
    return {
      error: "Unauthorized",
    }
  }

  const appointment = await getAppointmentContext(parsed.data.appointment_id)

  if (!appointment || appointment.patientId !== actor.patientId) {
    return {
      error: "Appointment not found.",
    }
  }

  if (appointment.status !== "scheduled" || appointment.bookedBy !== "provider") {
    return {
      error: "This appointment is no longer awaiting your confirmation.",
    }
  }

  await updateAppointmentStatus({
    appointmentId: appointment.id,
    values: {
      cancel_reason: parsed.data.reason || "Declined by patient",
      cancelled_at: new Date().toISOString(),
      status: "cancelled",
    },
  })

  await insertNotification({
    link: "/appointments",
    message: `${appointment.patientName} declined the appointment on ${formatDate(appointment.scheduledAt)}. Reason: ${parsed.data.reason || "No reason given"}`,
    title: "Appointment Declined by Patient",
    userId: appointment.providerProfileId,
  })

  revalidateAppointmentPaths(appointment.id)

  return {
    success: true,
  }
}

export async function confirmAppointmentByProviderAction(
  input: unknown
): Promise<AppointmentActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(normalizeAppointmentInput(input))

  if (!parsed.success) {
    return {
      error: "Invalid appointment.",
    }
  }

  const actor = await getCurrentAppointmentActor()

  if (actor.role !== "provider") {
    return {
      error: "Unauthorized",
    }
  }

  const appointment = await getAppointmentContext(parsed.data.appointment_id)

  if (!appointment || appointment.providerId !== actor.providerId) {
    return {
      error: "Appointment not found.",
    }
  }

  if (appointment.status !== "scheduled" || appointment.bookedBy !== "patient") {
    return {
      error: "This appointment is no longer awaiting your approval.",
    }
  }

  await updateAppointmentStatus({
    appointmentId: appointment.id,
    values: {
      status: "confirmed",
    },
  })

  await insertNotification({
    link: "/portal/appointments",
    message: `Your appointment on ${formatDate(appointment.scheduledAt)} at ${formatTime(appointment.scheduledAt)} is confirmed!`,
    title: "Appointment Confirmed",
    userId: appointment.patientProfileId,
  })

  revalidateAppointmentPaths(appointment.id)

  return {
    success: true,
  }
}

export async function declineAppointmentByProviderAction(
  input: unknown
): Promise<AppointmentActionResult> {
  const parsed = appointmentDeclineSchema.safeParse(
    typeof input === "string" ? { appointment_id: input } : input
  )

  if (!parsed.success) {
    return {
      error: "Invalid appointment.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const actor = await getCurrentAppointmentActor()

  if (actor.role !== "provider") {
    return {
      error: "Unauthorized",
    }
  }

  const appointment = await getAppointmentContext(parsed.data.appointment_id)

  if (!appointment || appointment.providerId !== actor.providerId) {
    return {
      error: "Appointment not found.",
    }
  }

  if (appointment.status !== "scheduled" || appointment.bookedBy !== "patient") {
    return {
      error: "This appointment is no longer awaiting your approval.",
    }
  }

  await updateAppointmentStatus({
    appointmentId: appointment.id,
    values: {
      cancel_reason: parsed.data.reason || "Declined by provider",
      cancelled_at: new Date().toISOString(),
      status: "cancelled",
    },
  })

  await insertNotification({
    link: "/portal/appointments",
    message: `Your appointment request for ${formatDate(appointment.scheduledAt)} at ${formatTime(appointment.scheduledAt)} was declined.`,
    title: "Appointment Request Declined",
    userId: appointment.patientProfileId,
  })

  revalidateAppointmentPaths(appointment.id)

  return {
    success: true,
  }
}

export async function cancelAppointmentAction(
  input: unknown
): Promise<AppointmentActionResult> {
  const parsed = cancelAppointmentSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Invalid appointment.",
    }
  }

  const actor = await getCurrentAppointmentActor()

  if (actor.role !== "provider") {
    return {
      error: "Unauthorized",
    }
  }

  const appointment = await getAppointmentContext(parsed.data.appointment_id)

  if (!appointment || appointment.providerId !== actor.providerId) {
    return {
      error: "Appointment not found.",
    }
  }

  if (appointment.status === "completed") {
    return {
      error: "Completed appointments cannot be cancelled.",
    }
  }

  if (appointment.status === "in_progress") {
    return {
      error: "Cannot cancel an appointment that is currently in progress.",
    }
  }

  if (appointment.status === "cancelled") {
    return {
      error: "This appointment is already cancelled.",
    }
  }

  if (appointment.status === "scheduled" && appointment.bookedBy === "provider") {
    return {
      error: "This appointment is awaiting patient confirmation and cannot be cancelled yet.",
    }
  }

  if (appointment.status === "scheduled" && appointment.bookedBy === "patient") {
    return {
      error: "Use approve or decline to respond to this appointment request.",
    }
  }

  await updateAppointmentStatus({
    appointmentId: appointment.id,
    values: {
      cancel_reason: "Cancelled by provider",
      cancelled_at: new Date().toISOString(),
      status: "cancelled",
    },
  })

  revalidateAppointmentPaths(appointment.id)

  return {
    success: true,
  }
}
