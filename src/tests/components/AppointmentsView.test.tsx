import { render, screen } from "@testing-library/react"
import { vi } from "vitest"

import { AppointmentsView } from "@/components/appointments/AppointmentsView"

vi.mock("@/components/appointments/ScheduleAppointmentDialog", () => ({
  ScheduleAppointmentDialog: () => <div>Schedule dialog</div>,
}))

vi.mock("@/components/appointments/CancelAppointmentButton", () => ({
  CancelAppointmentButton: () => <button type="button">Cancel</button>,
}))

describe("AppointmentsView", () => {
  it("hides cancel for completed, in-progress, and cancelled appointments", () => {
    render(
      <AppointmentsView
        appointments={[
          {
            bookedBy: "provider",
            cancelReason: null,
            duration: 30,
            id: "appt-1",
            meetingRoomId: null,
            patientAvatarUrl: null,
            patientId: "PAT-001",
            patientName: "Alice Smith",
            reason: "Follow-up consultation",
            scheduledAt: "2099-03-20T04:30:00.000Z",
            status: "confirmed",
            type: "video",
          },
          {
            bookedBy: "provider",
            cancelReason: null,
            duration: 30,
            id: "appt-2",
            meetingRoomId: null,
            patientAvatarUrl: null,
            patientId: "PAT-002",
            patientName: "Bob Jones",
            reason: "Completed review",
            scheduledAt: "2099-03-21T04:30:00.000Z",
            status: "completed",
            type: "video",
          },
          {
            bookedBy: "provider",
            cancelReason: null,
            duration: 30,
            id: "appt-3",
            meetingRoomId: null,
            patientAvatarUrl: null,
            patientId: "PAT-003",
            patientName: "Cara Lee",
            reason: "Live consultation",
            scheduledAt: "2099-03-22T04:30:00.000Z",
            status: "in_progress",
            type: "video",
          },
          {
            bookedBy: "provider",
            cancelReason: "Cancelled by provider",
            duration: 30,
            id: "appt-4",
            meetingRoomId: null,
            patientAvatarUrl: null,
            patientId: "PAT-004",
            patientName: "Dan Cole",
            reason: "Cancelled visit",
            scheduledAt: "2099-03-23T04:30:00.000Z",
            status: "cancelled",
            type: "video",
          },
        ]}
        patients={[]}
        providerAvailability={[]}
        slotDuration={30}
      />
    )

    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(1)
  })
})
