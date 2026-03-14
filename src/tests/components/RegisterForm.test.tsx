import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { RegisterForm } from "@/components/auth/RegisterForm"

const { registerAction } = vi.hoisted(() => ({
  registerAction: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  loginAction: vi.fn(),
  registerAction,
}))

describe("RegisterForm", () => {
  beforeEach(() => {
    registerAction.mockReset()
  })

  it("switches to provider onboarding fields", async () => {
    const user = userEvent.setup()

    render(<RegisterForm />)

    await user.click(screen.getByRole("button", { name: /i am a provider/i }))

    expect(screen.getByLabelText("Specialty")).toBeInTheDocument()
    expect(screen.getByLabelText("License Number")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create Provider Account" })).toBeInTheDocument()
  })

  it("submits a valid provider registration payload", async () => {
    const user = userEvent.setup()
    registerAction.mockResolvedValue({ success: "Account created" })

    render(<RegisterForm />)

    await user.click(screen.getByRole("button", { name: /i am a provider/i }))
    await user.type(screen.getByLabelText("Full Name"), "Dr. Kavya Sharma")
    await user.type(screen.getByLabelText("Email"), "dr.kavya@healthflow.com")
    await user.type(screen.getByLabelText("Password"), "StrongPass1")
    await user.type(screen.getByLabelText("Confirm Password"), "StrongPass1")
    await user.type(screen.getByLabelText("Phone"), "9876543210")
    await user.type(screen.getByLabelText("Specialty"), "Cardiology")
    await user.type(screen.getByLabelText("License Number"), "MH-2026-001")
    await user.type(screen.getByLabelText("License State"), "Maharashtra")
    await user.click(screen.getByRole("button", { name: "Create Provider Account" }))

    await waitFor(() => {
      expect(registerAction).toHaveBeenCalledWith({
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
        specialty: "Cardiology",
        license_number: "MH-2026-001",
        license_state: "Maharashtra",
      })
    })
  }, 10000)
})
