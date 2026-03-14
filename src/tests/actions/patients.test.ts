import { beforeEach, describe, expect, it, vi } from "vitest"

type MockAppointmentRow = {
  id: string
  patient_id: string
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
  deleteUserMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createClientMock: vi.fn(),
  deleteUserMock: vi.fn(),
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

import { deletePatientAction } from "@/actions/patients"

function createFilterQuery<T extends Record<string, unknown>>(
  rows: T[],
  options?: {
    countOnly?: boolean
    resolveWithErrorOnly?: boolean
  }
) {
  const filters: Array<(row: T) => boolean> = []

  const applyFilters = () => rows.filter((row) => filters.every((filter) => filter(row)))

  const query = {
    eq(column: string, value: unknown) {
      filters.push((row) => row[column] === value)
      return query
    },
    in(column: string, values: unknown[]) {
      filters.push((row) => values.includes(row[column]))
      return query
    },
    single() {
      return Promise.resolve({
        data: applyFilters()[0] ?? null,
        error: null,
      })
    },
    then<TResult1>(
      onfulfilled?:
        | ((value: { count?: number; data?: T[] | null; error: null }) => TResult1 | PromiseLike<TResult1>)
        | null
        | undefined
    ) {
      if (options?.resolveWithErrorOnly) {
        return Promise.resolve({ error: null }).then(onfulfilled)
      }

      if (options?.countOnly) {
        return Promise.resolve({
          count: applyFilters().length,
          data: null,
          error: null,
        }).then(onfulfilled)
      }

      return Promise.resolve({
        data: applyFilters(),
        error: null,
      }).then(onfulfilled)
    },
  }

  return query
}

function configureMocks({
  appointments = [],
}: {
  appointments?: MockAppointmentRow[]
}) {
  const patientRow: MockPatientRow = {
    id: "11111111-1111-4111-8111-111111111111",
    profile_id: "55555555-5555-4555-8555-555555555555",
  }
  const providerRow: MockProviderRow = {
    id: "22222222-2222-4222-8222-222222222222",
    profile_id: "33333333-3333-4333-8333-333333333333",
  }

  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: providerRow.profile_id },
        },
      }),
    },
    from(table: string) {
      if (table === "providers") {
        return {
          select: () => createFilterQuery([providerRow]),
        }
      }

      throw new Error(`Unexpected server table: ${table}`)
    },
  })

  createAdminClientMock.mockReturnValue({
    auth: {
      admin: {
        deleteUser: deleteUserMock,
      },
    },
    from(table: string) {
      if (table === "patients") {
        return {
          select: () => createFilterQuery([patientRow]),
        }
      }

      if (table === "appointments") {
        return {
          select: () => createFilterQuery(appointments, { countOnly: true }),
        }
      }

      if (table === "messages" || table === "notifications") {
        return {
          delete: () => createFilterQuery([], { resolveWithErrorOnly: true }),
        }
      }

      throw new Error(`Unexpected admin table: ${table}`)
    },
  })
}

describe("deletePatientAction", () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    createClientMock.mockReset()
    deleteUserMock.mockReset()
    deleteUserMock.mockResolvedValue({ error: null })
    revalidatePathMock.mockReset()
  })

  it("blocks deletion when the patient has active appointments", async () => {
    configureMocks({
      appointments: [
        {
          id: "appt-1",
          patient_id: "11111111-1111-4111-8111-111111111111",
          status: "scheduled",
        },
        {
          id: "appt-2",
          patient_id: "11111111-1111-4111-8111-111111111111",
          status: "confirmed",
        },
      ],
    })

    const result = await deletePatientAction("11111111-1111-4111-8111-111111111111")

    expect(result).toEqual({
      error:
        "Cannot delete patient — they have 2 active appointment(s). Cancel all appointments first.",
    })
    expect(deleteUserMock).not.toHaveBeenCalled()
  })

  it("deletes the patient when there are no active appointments", async () => {
    configureMocks({
      appointments: [],
    })

    const result = await deletePatientAction("11111111-1111-4111-8111-111111111111")

    expect(result).toEqual({ success: true })
    expect(deleteUserMock).toHaveBeenCalledWith("55555555-5555-4555-8555-555555555555")
    expect(revalidatePathMock).toHaveBeenCalledWith("/patients")
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard")
  })
})
