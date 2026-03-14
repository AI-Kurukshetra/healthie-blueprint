import { beforeEach, describe, expect, it, vi } from "vitest"

type MockProviderRow = {
  id: string
  profile_id: string
}

type MockNoteRow = {
  id: string
  patient_id: string
  provider_id: string
  status: string
}

const {
  createClientMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

import { signNoteAction } from "@/actions/notes"

function createSelectQuery<T extends Record<string, unknown>>(rows: T[]) {
  const filters: Array<(row: T) => boolean> = []

  const applyFilters = () => rows.filter((row) => filters.every((filter) => filter(row)))

  return {
    eq(column: string, value: unknown) {
      filters.push((row) => row[column] === value)
      return this
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
  note,
}: {
  note: MockNoteRow
}) {
  const provider: MockProviderRow = {
    id: "22222222-2222-4222-8222-222222222222",
    profile_id: "33333333-3333-4333-8333-333333333333",
  }

  const updateMock = vi.fn().mockResolvedValue({ error: null })

  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: { id: "33333333-3333-4333-8333-333333333333" },
        },
      }),
    },
    from(table: string) {
      if (table === "providers") {
        return {
          select: () => createSelectQuery([provider]),
        }
      }

      if (table === "clinical_notes") {
        return {
          select: () => createSelectQuery([note]),
          update: () => ({
            eq: updateMock,
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    },
  })

  return { updateMock }
}

const validPayload = {
  appointment_id: "",
  assessment: "Clinical assessment indicates stable recovery.",
  bp_diastolic: "",
  bp_systolic: "",
  diagnosis_codes: [],
  heart_rate: "",
  height: "",
  objective: "",
  oxygen_sat: "",
  patient_id: "11111111-1111-4111-8111-111111111111",
  plan: "Continue medication and follow up in two weeks.",
  subjective: "Patient reports improved sleep and less pain this week.",
  temperature: "",
  weight: "",
}

describe("signNoteAction", () => {
  beforeEach(() => {
    createClientMock.mockReset()
    revalidatePathMock.mockReset()
  })

  it("blocks signing when required SOAP sections are blank", async () => {
    configureMocks({
      note: {
        id: "44444444-4444-4444-8444-444444444444",
        patient_id: "11111111-1111-4111-8111-111111111111",
        provider_id: "22222222-2222-4222-8222-222222222222",
        status: "draft",
      },
    })

    const result = await signNoteAction("44444444-4444-4444-8444-444444444444", {
      ...validPayload,
      assessment: "     ",
      plan: "          ",
      subjective: "          ",
    })

    expect(result).toEqual({
      error:
        "Cannot sign an incomplete note. Subjective, Assessment and Plan are required.",
    })
  })

  it("only allows the note creator to sign the note", async () => {
    const { updateMock } = configureMocks({
      note: {
        id: "44444444-4444-4444-8444-444444444444",
        patient_id: "11111111-1111-4111-8111-111111111111",
        provider_id: "99999999-9999-4999-8999-999999999999",
        status: "draft",
      },
    })

    const result = await signNoteAction(
      "44444444-4444-4444-8444-444444444444",
      validPayload
    )

    expect(result).toEqual({
      error: "You can only sign your own notes.",
    })
    expect(updateMock).not.toHaveBeenCalled()
  })
})
