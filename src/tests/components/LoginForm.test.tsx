import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { LoginForm } from "@/components/auth/LoginForm"

const { loginAction } = vi.hoisted(() => ({
  loginAction: vi.fn(),
}))

vi.mock("@/actions/auth", () => ({
  loginAction,
  registerAction: vi.fn(),
}))

describe("LoginForm", () => {
  beforeEach(() => {
    loginAction.mockReset()
  })

  it("shows inline validation when submitted empty", async () => {
    const user = userEvent.setup()

    render(<LoginForm />)

    await user.click(screen.getByRole("button", { name: "Sign In" }))

    expect(await screen.findByText("Email is required")).toBeInTheDocument()
    expect(screen.getByText("Password is required")).toBeInTheDocument()
    expect(loginAction).not.toHaveBeenCalled()
  })

  it("submits valid credentials to the server action", async () => {
    const user = userEvent.setup()
    loginAction.mockResolvedValue({})

    render(<LoginForm />)

    await user.type(screen.getByLabelText("Email"), "dr.sharma@healthflow.com")
    await user.type(screen.getByLabelText("Password"), "TestPass123")
    await user.click(screen.getByRole("button", { name: "Sign In" }))

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith({
        email: "dr.sharma@healthflow.com",
        password: "TestPass123",
      })
    })
  })
})
