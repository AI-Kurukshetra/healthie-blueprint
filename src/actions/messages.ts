"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import {
  markThreadReadSchema,
  messageSchema,
} from "@/lib/validations/message"

type MessageActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  message?: {
    content: string
    createdAt: string
    id: string
    isRead: boolean
    patientId: string | null
    receiverId: string
    senderId: string
  }
  success?: boolean
}

export async function sendMessageAction(input: unknown): Promise<MessageActionResult> {
  const parsed = messageSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the message before sending.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const trimmedContent = parsed.data.content.trim()

  if (!trimmedContent) {
    return {
      error: "Message cannot be empty.",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: "Unauthorized",
    }
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      content: trimmedContent,
      patient_id: parsed.data.patient_id ?? null,
      receiver_id: parsed.data.receiver_id,
      sender_id: user.id,
    })
    .select("content, created_at, id, is_read, patient_id, receiver_id, sender_id")
    .single()

  if (error || !data) {
    return {
      error: error?.message ?? "Unable to send message.",
    }
  }

  revalidatePath("/messages")
  revalidatePath("/portal/messages")

  return {
    message: {
      content: data.content,
      createdAt: data.created_at,
      id: data.id,
      isRead: data.is_read,
      patientId: data.patient_id,
      receiverId: data.receiver_id,
      senderId: data.sender_id,
    },
    success: true,
  }
}

export async function markThreadReadAction(input: unknown): Promise<MessageActionResult> {
  const parsed = markThreadReadSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Invalid conversation.",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: "Unauthorized",
    }
  }

  const { error } = await supabase
    .from("messages")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("receiver_id", user.id)
    .eq("sender_id", parsed.data.counterpart_id)
    .eq("is_read", false)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidatePath("/messages")
  revalidatePath("/portal/messages")

  return {
    success: true,
  }
}
