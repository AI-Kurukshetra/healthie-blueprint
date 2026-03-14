import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { DeletePatientButton } from "@/components/patients/DeletePatientButton"

const { deletePatientAction, pushMock, refreshMock } = vi.hoisted(() => ({
  deletePatientAction: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}))

vi.mock("@/actions/patients", () => ({
  createPatientAction: vi.fn(),
  deletePatientAction,
  updatePatientAction: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

describe("DeletePatientButton", () => {
  beforeEach(() => {
    deletePatientAction.mockReset()
    pushMock.mockReset()
    refreshMock.mockReset()
  })

  it("shows the server delete error inside the confirmation dialog", async () => {
    const user = userEvent.setup()
    deletePatientAction.mockResolvedValue({
      error:
        "Cannot delete patient — they have 2 active appointment(s). Cancel all appointments first.",
    })

    render(<DeletePatientButton patientId="11111111-1111-4111-8111-111111111111" />)

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await user.click(screen.getByRole("button", { name: "Delete patient" }))

    await waitFor(() => {
      expect(
        screen.getByText(
          "Cannot delete patient — they have 2 active appointment(s). Cancel all appointments first."
        )
      ).toBeInTheDocument()
    })

    expect(pushMock).not.toHaveBeenCalled()
    expect(refreshMock).not.toHaveBeenCalled()
  })
})
