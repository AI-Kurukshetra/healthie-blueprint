import { carePlanSchema } from "@/lib/validations/care-plan"

const validCarePlan = {
  title: "Hypertension Management Plan",
  goals: "Reduce blood pressure to below 130/80 within 3 months",
  start_date: "2026-01-01",
  status: "active" as const,
}

describe("carePlanSchema", () => {
  it("accepts a valid care plan", () => {
    expect(carePlanSchema.safeParse(validCarePlan).success).toBe(true)
  })

  it("rejects short title", () => {
    expect(
      carePlanSchema.safeParse({
        ...validCarePlan,
        title: "Hi",
      }).success
    ).toBe(false)
  })

  it("rejects short goals", () => {
    expect(
      carePlanSchema.safeParse({
        ...validCarePlan,
        goals: "Too short",
      }).success
    ).toBe(false)
  })

  it("rejects missing start date", () => {
    expect(
      carePlanSchema.safeParse({
        ...validCarePlan,
        start_date: "",
      }).success
    ).toBe(false)
  })

  it("rejects invalid status", () => {
    expect(
      carePlanSchema.safeParse({
        ...validCarePlan,
        status: "unknown",
      }).success
    ).toBe(false)
  })

  it("allows optional fields to be empty", () => {
    expect(
      carePlanSchema.safeParse({
        ...validCarePlan,
        diet_notes: "",
        exercise: "",
      }).success
    ).toBe(true)
  })
})
