"use server"

import { revalidatePath } from "next/cache"

import {
  getPatientLabOrders,
  getProviderLabOrders,
  type LabOrderFilter,
} from "@/lib/data/labs"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  labOrderSchema,
  labOrderStatusSchema,
  labResultSchema,
  type LabOrderInput,
  type LabResultInput,
} from "@/lib/validations/lab"

type LabActionResult = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  orderId?: string
  orderNumber?: string
  success?: boolean
}

function cleanOptional(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function revalidateLabPaths(patientId?: string, orderId?: string) {
  revalidatePath("/labs")
  revalidatePath("/dashboard")
  revalidatePath("/portal")
  revalidatePath("/portal/labs")
  if (patientId) {
    revalidatePath(`/patients/${patientId}`)
    revalidatePath(`/patients/${patientId}/timeline`)
  }
  if (orderId) {
    revalidatePath(`/labs/${orderId}`)
  }
}

async function getCurrentProvider() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: provider, error } = await supabase
    .from("providers")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .single()

  if (error || !provider) {
    throw new Error("Unauthorized")
  }

  return provider
}

async function getLabOrderContext(orderId: string) {
  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from("lab_orders")
    .select(
      "appointment_id, id, order_number, patient_id, provider_id, priority, status, test_name, test_type"
    )
    .eq("id", orderId)
    .maybeSingle()

  if (error || !order) {
    throw new Error(error?.message ?? "Lab order not found.")
  }

  const [
    patientResult,
    providerResult,
  ] = await Promise.all([
    admin
      .from("patients")
      .select("id, patient_id, profile_id")
      .eq("id", order.patient_id)
      .single(),
    admin
      .from("providers")
      .select("id, profile_id")
      .eq("id", order.provider_id)
      .single(),
  ])

  if (patientResult.error || providerResult.error) {
    throw new Error(patientResult.error?.message ?? providerResult.error?.message ?? "Unable to load lab order participants.")
  }

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [patientResult.data.profile_id, providerResult.data.profile_id])

  if (profileError) {
    throw new Error(profileError.message)
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]))

  return {
    order,
    patient: patientResult.data,
    patientName: profileMap.get(patientResult.data.profile_id) ?? "Patient",
    provider: providerResult.data,
    providerName: profileMap.get(providerResult.data.profile_id) ?? "Provider",
  }
}

async function insertNotification({
  link,
  message,
  title,
  type = "system",
  userId,
}: {
  link: string | null
  message: string
  title: string
  type?: "appointment" | "message" | "record" | "reminder" | "system"
  userId: string
}) {
  const admin = createAdminClient()
  const { error } = await admin.from("notifications").insert({
    link,
    message,
    title,
    type,
    user_id: userId,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function orderLabAction(input: LabOrderInput): Promise<LabActionResult> {
  const parsed = labOrderSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  const admin = createAdminClient()
  const values = parsed.data
  const { data: order, error } = await admin
    .from("lab_orders")
    .insert({
      appointment_id: cleanOptional(values.appointment_id),
      instructions: cleanOptional(values.instructions),
      order_number: "PENDING",
      patient_id: values.patient_id,
      priority: values.priority,
      provider_id: provider.id,
      status: "ordered",
      test_name: values.test_name,
      test_type: values.test_type,
    })
    .select("id, order_number, patient_id")
    .single()

  if (error || !order) {
    return {
      error: error?.message ?? "Unable to create lab order.",
    }
  }

  const context = await getLabOrderContext(order.id)
  await insertNotification({
    link: "/portal/labs",
    message: `Your doctor has ordered a lab test: ${context.order.test_name}. Please visit the lab at your earliest convenience.`,
    title: "New Lab Test Ordered",
    type: "reminder",
    userId: context.patient.profile_id,
  })

  revalidateLabPaths(order.patient_id, order.id)

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    success: true,
  }
}

export async function updateLabStatusAction(
  orderId: string,
  status: string
): Promise<LabActionResult> {
  const parsed = labOrderStatusSchema.safeParse(status)

  if (!parsed.success) {
    return {
      error: "Invalid lab status.",
    }
  }

  const provider = await getCurrentProvider()
  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from("lab_orders")
    .update({
      status: parsed.data,
    })
    .eq("id", orderId)
    .eq("provider_id", provider.id)
    .select("id, patient_id")
    .single()

  if (error || !order) {
    return {
      error: error?.message ?? "Unable to update lab order.",
    }
  }

  revalidateLabPaths(order.patient_id, order.id)

  return { success: true }
}

export async function uploadLabResultAction(
  orderId: string,
  input: LabResultInput
): Promise<LabActionResult> {
  const parsed = labResultSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const provider = await getCurrentProvider()
  const admin = createAdminClient()
  const context = await getLabOrderContext(orderId)

  if (context.provider.id !== provider.id) {
    return {
      error: "Unauthorized",
    }
  }

  const values = parsed.data
  const { data: existingResult, error: resultLookupError } = await admin
    .from("lab_results")
    .select("id")
    .eq("lab_order_id", orderId)
    .maybeSingle()

  if (resultLookupError) {
    return {
      error: resultLookupError.message,
    }
  }

  if (existingResult) {
    const { error } = await admin
      .from("lab_results")
      .update({
        file_url: cleanOptional(values.file_url),
        findings: cleanOptional(values.findings),
        is_abnormal: values.is_abnormal,
        notes: cleanOptional(values.notes),
        reported_at: new Date().toISOString(),
        result_summary: values.result_summary,
      })
      .eq("id", existingResult.id)

    if (error) {
      return {
        error: error.message,
      }
    }
  } else {
    const { error } = await admin.from("lab_results").insert({
      file_url: cleanOptional(values.file_url),
      findings: cleanOptional(values.findings),
      is_abnormal: values.is_abnormal,
      lab_order_id: orderId,
      notes: cleanOptional(values.notes),
      patient_id: context.patient.id,
      provider_id: provider.id,
      reported_at: new Date().toISOString(),
      result_summary: values.result_summary,
    })

    if (error) {
      return {
        error: error.message,
      }
    }
  }

  const { error: orderUpdateError } = await admin
    .from("lab_orders")
    .update({
      status: values.status,
    })
    .eq("id", orderId)
    .eq("provider_id", provider.id)

  if (orderUpdateError) {
    return {
      error: orderUpdateError.message,
    }
  }

  if (values.is_abnormal) {
    await Promise.all([
      insertNotification({
        link: "/portal/labs",
        message: `Your lab result for ${context.order.test_name} is ready and requires attention. Please contact your provider.`,
        title: "Abnormal Lab Result Ready",
        type: "record",
        userId: context.patient.profile_id,
      }),
      insertNotification({
        link: "/labs",
        message: `${context.patientName} has an abnormal lab result for ${context.order.test_name}.`,
        title: "Abnormal Lab Result Recorded",
        type: "record",
        userId: context.provider.profile_id,
      }),
    ])
  } else {
    await insertNotification({
      link: "/portal/labs",
      message: `Your lab result for ${context.order.test_name} is ready. You can view it in your portal.`,
      title: "Lab Result Ready",
      type: "record",
      userId: context.patient.profile_id,
    })
  }

  revalidateLabPaths(context.patient.id, orderId)

  return { success: true }
}

export async function getLabOrdersAction(filters?: LabOrderFilter) {
  return getProviderLabOrders(filters)
}

export async function getPatientLabsAction(patientId: string) {
  return getPatientLabOrders(patientId)
}
