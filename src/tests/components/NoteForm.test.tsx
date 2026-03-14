import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { cloneElement, type ReactElement, type ReactNode } from "react"

import { NoteForm } from "@/components/notes/NoteForm"

const { pushMock, refreshMock, saveDraftNoteActionMock, signNoteActionMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  saveDraftNoteActionMock: vi.fn(),
  signNoteActionMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

vi.mock("@/actions/notes", () => ({
  saveDraftNoteAction: saveDraftNoteActionMock,
  signNoteAction: signNoteActionMock,
}))

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogClose: ({
    children,
    render,
  }: {
    children: ReactNode
    render?: ReactElement
  }) => (render ? cloneElement(render, {}, children) : <button type="button">{children}</button>),
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({
    children,
    render,
  }: {
    children: ReactNode
    render?: ReactElement
  }) => (render ? cloneElement(render, {}, children) : <button type="button">{children}</button>),
}))

describe("NoteForm", () => {
  beforeEach(() => {
    pushMock.mockReset()
    refreshMock.mockReset()
    saveDraftNoteActionMock.mockReset()
    signNoteActionMock.mockReset()
  })

  it("shows a red inline alert when signing is rejected", async () => {
    const user = userEvent.setup()
    signNoteActionMock.mockResolvedValue({
      error: "You can only sign your own notes.",
    })

    render(
      <NoteForm
        appointmentOptions={[]}
        initialValues={{
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
        }}
        noteId="44444444-4444-4444-8444-444444444444"
        patientOptions={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            patientId: "PAT-001",
            patientName: "Alice Smith",
          },
        ]}
        readOnly={false}
      />
    )

    await user.click(screen.getByRole("button", { name: "Sign Note" }))
    await user.click(screen.getByRole("button", { name: "Confirm Sign" }))

    await waitFor(() => {
      expect(screen.getByText("You can only sign your own notes.")).toBeInTheDocument()
    })
  })
})
