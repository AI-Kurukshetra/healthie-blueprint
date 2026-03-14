import { noteIdSchema, soapNoteSchema } from "@/lib/validations/note"

describe("clinical note validation", () => {
  it("accepts a valid SOAP note", () => {
    const result = soapNoteSchema.safeParse({
      patient_id: "70d021c4-59d7-4c61-a37f-7fcb8bcfe1f5",
      appointment_id: "d0fab11e-d4c8-4230-a19f-5aa2d3c1a266",
      subjective: "Patient reports improved sleep and reduced headaches this week.",
      objective: "Vitals stable and no acute distress observed.",
      assessment: "Symptoms are improving with current treatment.",
      plan: "Continue current medication and return in two weeks for review.",
      bp_systolic: 122,
      bp_diastolic: 80,
      heart_rate: 72,
      temperature: 36.8,
      weight: 68,
      height: 172,
      oxygen_sat: 98,
      diagnosis_codes: ["I10"],
    })

    expect(result.success).toBe(true)
  })

  it("rejects out-of-range oxygen saturation", () => {
    const result = soapNoteSchema.safeParse({
      patient_id: "70d021c4-59d7-4c61-a37f-7fcb8bcfe1f5",
      subjective: "Patient reports persistent dizziness after standing.",
      objective: "",
      assessment: "Possible dehydration.",
      plan: "Increase fluids and monitor symptoms closely.",
      oxygen_sat: 65,
      diagnosis_codes: [],
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.oxygen_sat).toContain(
      "Oxygen saturation must be between 70 and 100"
    )
  })

  it("rejects an invalid note id", () => {
    const result = noteIdSchema.safeParse({
      id: "invalid",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.id).toContain("Invalid note")
  })
})
