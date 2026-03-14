import { beforeEach, describe, expect, it, vi } from "vitest"

type MockAppointmentRow = {
  id: string
  provider_id: string
  status: string
}

type MockPatientRow = {
  id: string
  profile_id: string
}

type MockProviderRow = {
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

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}))

import { cancelAppointmentAction } from "@/actions/appointments"

function createSelectQuery<T extends Record<string, unknown>>(rows: T[]) {
  const filters: Array<(row: T) => boolean> = []

  const applyFilters = () => rows.filter((row) => filters.every((filter) => filter(row)))

  return {
    eq(column: string, value: unknown) {
      filters.push((row) => row[column] === value)
      return this
    },
    maybeSingle() {
      return Promise.resolve({
        data: applyFilters()[0] ?? null,
        error: null,
      })
    },
    single() {
      return Promise.resolve({
        data: applyFilters()[0] ?? null,
        error: null,
      })
    },
  }
}

function configureMocks({
  appointment,
}: {
  appointment: MockAppointmentRow
}) {
  const patient: MockPatientRow = {
    id: "44444444-4444-4444-8444-444444444444",
    profile_id: "55555555-5555-4555-8555-555555555555",
  }
  const provider: MockProviderRow = {
    id: "22222222-2222-4222-8222-222222222222",
    profile_id: "33333333-3333-4333-8333-333333333333",
  }
  const updateMock = vi.fn().mockResolvedValue({ error: null })

  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: provider.profile_id },
        },
      }),
    },
    from(table: string) {
      if (table === "providers") {
        return {
          select: () => createSelectQuery([provider]),
        }
      }

      if (table === "patients") {
        return {
          select: () => createSelectQuery([]),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  })

  createAdminClientMock.mockReturnValue({
    from(table: string) {
      if (table === "appointments") {
        return {
          select: () => ({
            eq() {
              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    booked_by: "provider",
                    cancel_reason: null,
                    duration: 30,
                    id: appointment.id,
                    meeting_room_id: null,
                    patient_id: patient.id,
                    provider_id: appointment.provider_id,
                    reason: "Follow-up",
                    scheduled_at: "2099-03-20T04:30:00.000Z",
                    status: appointment.status,
                    type: "video",
                  },
                  error: null,
                }),
              }
            },
          }),
          update: () => ({
            eq: updateMock,
          }),
        }
      }

      if (table === "patients") {
        return {
          select: () => ({
            eq() {
              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: patient,
                  error: null,
                }),
              }
            },
          }),
        }
      }

      if (table === "providers") {
        return {
          select: () => ({
            eq() {
              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    ...provider,
                    specialty: "General Practice",
                  },
                  error: null,
                }),
              }
            },
          }),
        }
      }

      if (table === "profiles") {
        return {
          select: () => ({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  full_name: "Alice Smith",
                  id: patient.profile_id,
                },
                {
                  full_name: "Dr. Priya Sharma",
                  id: provider.profile_id,
                },
              ],
              error: null,
            }),
          }),
        }
      }

      throw new Error(`Unexpected admin table: ${table}`)
    },
  })

  return { updateMock }
}

describe("cancelAppointmentAction", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    createClientMock.mockReset()
    revalidatePathMock.mockReset()
  })

  it("blocks completed appointments from being cancelled", async () => {
    const { updateMock } = configureMocks({
      appointment: {
        id: "11111111-1111-4111-8111-111111111111",
        provider_id: "22222222-2222-4222-8222-222222222222",
        status: "completed",
      },
    })

    const result = await cancelAppointmentAction({
      appointment_id: "11111111-1111-4111-8111-111111111111",
    })

    expect(result).toEqual({
      error: "Completed appointments cannot be cancelled.",
    })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("blocks in-progress appointments from being cancelled", async () => {
    const { updateMock } = configureMocks({
      appointment: {
        id: "11111111-1111-4111-8111-111111111111",
        provider_id: "22222222-2222-4222-8222-222222222222",
        status: "in_progress",
      },
    })

    const result = await cancelAppointmentAction({
      appointment_id: "11111111-1111-4111-8111-111111111111",
    })

    expect(result).toEqual({
      error: "Cannot cancel an appointment that is currently in progress.",
    })
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("blocks already-cancelled appointments", async () => {
    const { updateMock } = configureMocks({
      appointment: {
        id: "11111111-1111-4111-8111-111111111111",
        provider_id: "22222222-2222-4222-8222-222222222222",
        status: "cancelled",
      },
    })

    const result = await cancelAppointmentAction({
      appointment_id: "11111111-1111-4111-8111-111111111111",
    })

    expect(result).toEqual({
      error: "This appointment is already cancelled.",
    })
    expect(updateMock).not.toHaveBeenCalled()
  })
})
