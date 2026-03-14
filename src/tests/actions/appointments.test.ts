import { beforeEach, describe, expect, it, vi } from "vitest"

type MockAppointmentRow = {
  duration: number
  id: string
  patient_id: string
  provider_id: string
  scheduled_at: string
  status: string
}

type MockLookupRow = {
  id: string
  profile_id: string
}

const {
  createAdminClientMock,
  createClientMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

import {
  createAppointmentAction,
  getBookedSlotsAction,
} from "@/actions/appointments"

function createSelectQuery<T extends Record<string, unknown>>(rows: T[]) {
  const filters: Array<(row: T) => boolean> = []

  const applyFilters = () => rows.filter((row) => filters.every((filter) => filter(row)))

  const query = {
    eq(column: string, value: unknown) {
      filters.push((row) => row[column] === value)
      return query
    },
    gte(column: string, value: string) {
      filters.push((row) => String(row[column]) >= value)
      return query
    },
    in(column: string, values: unknown[]) {
      filters.push((row) => values.includes(row[column]))
      return query
    },
    lt(column: string, value: string) {
      filters.push((row) => String(row[column]) < value)
      return query
    },
    maybeSingle() {
      return Promise.resolve({
        data: applyFilters()[0] ?? null,
        error: null,
      })
    },
    select() {
      return query
    },
    then<TResult1 = { data: T[]; error: null }>(
      onfulfilled?:
        | ((value: { data: T[]; error: null }) => TResult1 | PromiseLike<TResult1>)
        | null
        | undefined
    ) {
      return Promise.resolve({
        data: applyFilters(),
        error: null,
      }).then(onfulfilled)
    },
  }

  return query
}

function configureSupabaseMocks({
  actorRole,
  appointments = [],
  patientId = "11111111-1111-4111-8111-111111111111",
  providerId = "22222222-2222-4222-8222-222222222222",
}: {
  actorRole: "patient" | "provider"
  appointments?: MockAppointmentRow[]
  patientId?: string
  providerId?: string
}) {
  const userId =
    actorRole === "provider"
      ? "33333333-3333-4333-8333-333333333333"
      : "44444444-4444-4444-8444-444444444444"

  const providerRows: MockLookupRow[] =
    actorRole === "provider" ? [{ id: providerId, profile_id: userId }] : []
  const patientRows: MockLookupRow[] =
    actorRole === "patient" ? [{ id: patientId, profile_id: userId }] : []

  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: userId },
        },
      }),
    },
    from(table: string) {
      if (table === "providers") {
        return createSelectQuery(providerRows)
      }

      if (table === "patients") {
        return createSelectQuery(patientRows)
      }

      throw new Error(`Unexpected table for server client: ${table}`)
    },
  })

  createAdminClientMock.mockReturnValue({
    from(table: string) {
      if (table !== "appointments") {
        throw new Error(`Unexpected table for admin client: ${table}`)
      }

      const selectQuery = createSelectQuery(appointments)

      return {
        ...selectQuery,
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    },
  })
}

describe("appointment conflict checks", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    createClientMock.mockReset()
    revalidatePathMock.mockReset()
  })

  it("blocks provider booking when the patient already has an overlapping appointment", async () => {
    configureSupabaseMocks({
      actorRole: "provider",
      appointments: [
        {
          duration: 30,
          id: "appt-1",
          patient_id: "11111111-1111-4111-8111-111111111111",
          provider_id: "99999999-9999-4999-8999-999999999999",
          scheduled_at: "2099-03-20T04:30:00.000Z",
          status: "scheduled",
        },
      ],
    })

    const result = await createAppointmentAction({
      appointment_date: "2099-03-20",
      appointment_time: "10:15",
      duration: 30,
      patient_id: "11111111-1111-4111-8111-111111111111",
      reason: "Follow-up appointment for ongoing treatment.",
      type: "video",
    })

    expect(result.error).toBe(
      "Patient already has an appointment at this time. Please choose a different slot."
    )
  })

  it("blocks provider booking when the provider already has an overlapping appointment", async () => {
    configureSupabaseMocks({
      actorRole: "provider",
      appointments: [
        {
          duration: 45,
          id: "appt-2",
          patient_id: "88888888-8888-4888-8888-888888888888",
          provider_id: "22222222-2222-4222-8222-222222222222",
          scheduled_at: "2099-03-20T05:30:00.000Z",
          status: "confirmed",
        },
      ],
    })

    const result = await createAppointmentAction({
      appointment_date: "2099-03-20",
      appointment_time: "11:15",
      duration: 30,
      patient_id: "11111111-1111-4111-8111-111111111111",
      reason: "Consultation to discuss recent lab results.",
      type: "video",
    })

    expect(result.error).toBe(
      "This time slot is no longer available. Please choose a different slot."
    )
  })

  it("blocks patient portal booking when the selected provider slot is already taken", async () => {
    configureSupabaseMocks({
      actorRole: "patient",
      appointments: [
        {
          duration: 30,
          id: "appt-3",
          patient_id: "77777777-7777-4777-8777-777777777777",
          provider_id: "22222222-2222-4222-8222-222222222222",
          scheduled_at: "2099-03-20T08:30:00.000Z",
          status: "in_progress",
        },
      ],
    })

    const result = await createAppointmentAction({
      appointment_date: "2099-03-20",
      appointment_time: "14:00",
      duration: 30,
      provider_id: "22222222-2222-4222-8222-222222222222",
      reason: "Need advice about recurring migraine symptoms.",
      type: "video",
    })

    expect(result.error).toBe(
      "This time slot is no longer available. Please choose a different slot."
    )
  })

  it("returns booked slots for overlapping appointments on the selected provider date", async () => {
    configureSupabaseMocks({
      actorRole: "patient",
      appointments: [
        {
          duration: 30,
          id: "appt-4",
          patient_id: "66666666-6666-4666-8666-666666666666",
          provider_id: "22222222-2222-4222-8222-222222222222",
          scheduled_at: "2099-03-20T04:30:00.000Z",
          status: "scheduled",
        },
      ],
    })

    const result = await getBookedSlotsAction({
      appointment_date: "2099-03-20",
      duration: 30,
      provider_id: "22222222-2222-4222-8222-222222222222",
      slot_duration: 30,
    })

    expect(result.bookedSlots).toContain("10:00")
  })
})
