import {
  loginSchema,
  patientRegisterSchema,
  registerFormSchema,
  registerSchema,
} from "@/lib/validations/auth"

describe("auth validation", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "clinician@healthflow.com",
      password: "StrongPass1",
    })

    expect(result.success).toBe(true)
  })

  it("rejects invalid login email", () => {
    const result = loginSchema.safeParse({
      email: "bad-email",
      password: "StrongPass1",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.email).toContain("Invalid email format")
  })

  it("rejects provider registration when provider-only fields are blank", () => {
    const result = registerFormSchema.safeParse({
      role: "provider",
      consent_telehealth: false,
      consent_terms: false,
      consent_treatment: false,
      full_name: "Dr. Kavya Sharma",
      email: "dr.kavya@healthflow.com",
      password: "StrongPass1",
      confirm_password: "StrongPass1",
      phone: "9876543210",
      date_of_birth: "",
      gender: undefined,
      specialty: "",
      license_number: "",
      license_state: "",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.specialty).toContain("Specialty is required")
    expect(result.error?.flatten().fieldErrors.license_number).toContain(
      "License number is required"
    )
    expect(result.error?.flatten().fieldErrors.license_state).toContain(
      "License state is required"
    )
  })

  it("rejects mismatched patient passwords", () => {
    const result = registerSchema.safeParse({
      role: "patient",
      consent_telehealth: true,
      consent_terms: true,
      consent_treatment: true,
      full_name: "Aarav Mehta",
      email: "aarav@healthflow.com",
      password: "StrongPass1",
      confirm_password: "Mismatch1",
      phone: "9876543210",
      date_of_birth: "1994-06-12",
      gender: "male",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.confirm_password).toContain(
      "Passwords do not match"
    )
  })

  describe("patientRegisterSchema consent", () => {
    const valid = {
      confirm_password: "Password1",
      consent_telehealth: true,
      consent_terms: true,
      consent_treatment: true,
      date_of_birth: "1994-06-12",
      email: "test@test.com",
      full_name: "Test User",
      gender: "male" as const,
      password: "Password1",
      phone: "9876543210",
    }

    it("accepts patient registration when all consents are true", () => {
      expect(patientRegisterSchema.safeParse(valid).success).toBe(true)
    })

    it("rejects false treatment consent", () => {
      expect(
        patientRegisterSchema.safeParse({
          ...valid,
          consent_treatment: false,
        }).success
      ).toBe(false)
    })

    it("rejects false telehealth consent", () => {
      expect(
        patientRegisterSchema.safeParse({
          ...valid,
          consent_telehealth: false,
        }).success
      ).toBe(false)
    })

    it("rejects false terms consent", () => {
      expect(
        patientRegisterSchema.safeParse({
          ...valid,
          consent_terms: false,
        }).success
      ).toBe(false)
    })

    it("rejects a future date of birth", () => {
      expect(
        patientRegisterSchema.safeParse({
          ...valid,
          date_of_birth: "2999-01-01",
        }).success
      ).toBe(false)
    })
  })
})
