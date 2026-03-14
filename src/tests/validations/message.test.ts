import {
  markThreadReadSchema,
  messageSchema,
} from "@/lib/validations/message"

describe("message validation", () => {
  it("accepts a valid secure message", () => {
    const result = messageSchema.safeParse({
      content: "Please upload your latest blood pressure readings before tomorrow.",
      patient_id: "70d021c4-59d7-4c61-a37f-7fcb8bcfe1f5",
      receiver_id: "d0fab11e-d4c8-4230-a19f-5aa2d3c1a266",
    })

    expect(result.success).toBe(true)
  })

  it("rejects an empty message body", () => {
    const result = messageSchema.safeParse({
      content: "",
      receiver_id: "d0fab11e-d4c8-4230-a19f-5aa2d3c1a266",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.content).toContain(
      "Message cannot be empty"
    )
  })

  it("rejects an invalid read-thread payload", () => {
    const result = markThreadReadSchema.safeParse({
      counterpart_id: "abc",
    })

    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.counterpart_id).toContain(
      "Invalid conversation"
    )
  })
})
