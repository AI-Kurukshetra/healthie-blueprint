import { patientIdSchema, patientSchema } from "@/lib/validations/patient"

describe("patient validation", () => {
  it("accepts a valid patient form payload", () => {
    const result = patientSchema.safeParse({
      first_name: "Aarav",
      last_name: "Mehta",
      email: "aarav@healthflow.com",
      phone: "9876543210",
      date_of_birth: "1990-01-15",
      gender: "male",
      blood_group: "O+",
      allergies: ["Peanuts"],
      chronic_conditions: ["Asthma"],
      emergency_contact: "Riya Mehta",
      emergency_phone: "9123456789",
      insurance_provider: "Care Plus",
      insurance_id: "CP-2211",
    })

    expect(result.success).toBe(true)
    expect(result.data?.allergies).toEqual(["Peanuts"])
  })

  it("rejects an invalid primary phone number", () => {
    const result = patientSchema.safeParse({
      first_name: "Aarav",
      last_name: "Mehta",
      email: "aarav@healthflow.com",
      phone: "12345",
      allergies: [],
      chronic_conditions: [],
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.phone).toContain(
      "Enter valid 10-digit mobile number"
    )
  })

  it("rejects an invalid patient id", () => {
    const result = patientIdSchema.safeParse({
      id: "not-a-uuid",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.id).toContain("Invalid patient")
  })
})
