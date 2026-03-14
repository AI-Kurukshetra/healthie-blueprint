import {
  appointmentSchema,
  cancelAppointmentSchema,
} from "@/lib/validations/appointment"

describe("appointment validation", () => {
  it("accepts a valid appointment request", () => {
    const result = appointmentSchema.safeParse({
      patient_id: "70d021c4-59d7-4c61-a37f-7fcb8bcfe1f5",
      appointment_date: "2026-03-20",
      appointment_time: "10:30",
      duration: 30,
      type: "video",
      reason: "Follow-up visit to review blood pressure readings.",
    })

    expect(result.success).toBe(true)
  })

  it("rejects an appointment with a short reason", () => {
    const result = appointmentSchema.safeParse({
      patient_id: "70d021c4-59d7-4c61-a37f-7fcb8bcfe1f5",
      appointment_date: "2026-03-20",
      appointment_time: "10:30",
      duration: 30,
      type: "video",
      reason: "Checkup",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.reason).toContain(
      "Please describe the reason in at least 10 characters"
    )
  })

  it("rejects an invalid cancel appointment id", () => {
    const result = cancelAppointmentSchema.safeParse({
      appointment_id: "abc",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.appointment_id).toContain(
      "Invalid appointment"
    )
  })
})
