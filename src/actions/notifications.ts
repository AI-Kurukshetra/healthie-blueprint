"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

type NotificationActionResult = {
  error?: string
  success?: boolean
}

const notificationSchema = z.object({
  notification_id: z.string().uuid("Invalid notification"),
})

const NOTIFICATION_PATHS = [
  "/appointments",
  "/dashboard",
  "/messages",
  "/notes",
  "/patients",
  "/portal",
  "/portal/appointments",
  "/portal/messages",
  "/portal/records",
] as const

function revalidateNotificationPaths() {
  for (const path of NOTIFICATION_PATHS) {
    revalidatePath(path)
  }
}

export async function markNotificationReadAction(
  input: unknown
): Promise<NotificationActionResult> {
  const parsed = notificationSchema.safeParse(
    typeof input === "string" ? { notification_id: input } : input
  )

  if (!parsed.success) {
    return {
      error: "Invalid notification.",
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
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", parsed.data.notification_id)
    .eq("user_id", user.id)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateNotificationPaths()

  return {
    success: true,
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
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
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    return {
      error: error.message,
    }
  }

  revalidateNotificationPaths()

  return {
    success: true,
  }
}
