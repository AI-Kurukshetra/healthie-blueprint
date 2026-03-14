import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export type ProviderLabOrderListItem = {
  appointmentId: string | null
  fileUrl: string | null
  findings: string | null
  id: string
  instructions: string | null
  isAbnormal: boolean
  notes: string | null
  orderNumber: string
  orderedAt: string
  patientId: string
  patientName: string
  priority: string
  providerName: string
  reportedAt: string | null
  resultId: string | null
  resultSummary: string | null
  status: string
  testName: string
  testType: string
  updatedAt: string
}

export type ProviderLabOrderDetail = {
  findings: string | null
  fileUrl: string | null
  id: string
  instructions: string | null
  isAbnormal: boolean
  notes: string | null
  orderNumber: string
  orderedAt: string
  patientId: string
  patientName: string
  patientRecordId: string
  priority: string
  providerName: string
  reportedAt: string | null
  resultSummary: string | null
  status: string
  testName: string
  testType: string
  timeline: Array<{
    date: string
    description: string
    title: string
  }>
  updatedAt: string
}

export type PatientLabListItem = {
  fileUrl: string | null
  findings: string | null
  id: string
  instructions: string | null
  isAbnormal: boolean
  notes: string | null
  orderNumber: string
  orderedAt: string
  providerName: string
  priority: string
  reportedAt: string | null
  resultSummary: string | null
  status: string
  testName: string
  testType: string
}

export type OrderLabPatientOption = {
  id: string
  patientId: string
  patientName: string
}

export type LabOrderFilter = {
  patientId?: string
  priority?: string
  status?: string
}

type LabOrderRow = Pick<
  Tables<"lab_orders">,
  | "appointment_id"
  | "id"
  | "instructions"
  | "order_number"
  | "ordered_at"
  | "patient_id"
  | "priority"
  | "provider_id"
  | "status"
  | "test_name"
  | "test_type"
  | "updated_at"
>

type LabResultRow = Pick<
  Tables<"lab_results">,
  | "file_url"
  | "findings"
  | "id"
  | "is_abnormal"
  | "lab_order_id"
  | "notes"
  | "reported_at"
  | "result_summary"
>

type PatientLookupRow = Pick<Tables<"patients">, "id" | "patient_id" | "profile_id">
type ProviderLookupRow = Pick<Tables<"providers">, "id" | "profile_id">
type ProfileLookupRow = Pick<Tables<"profiles">, "full_name" | "id">

async function getProviderContext() {
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
    .maybeSingle()

  if (error || !provider) {
    throw new Error("Unauthorized")
  }

  return provider
}

async function getPatientContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, profile_id")
    .eq("profile_id", user.id)
    .maybeSingle()

  if (error || !patient) {
    throw new Error("Unauthorized")
  }

  return patient
}

async function getProfileNames(profileIds: string[]) {
  const admin = createAdminClient()

  if (profileIds.length === 0) {
    return new Map<string, string>()
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name")
    .in("id", [...new Set(profileIds)])

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((profile: ProfileLookupRow) => [profile.id, profile.full_name]))
}

async function getLabResultMap(orderIds: string[]) {
  const admin = createAdminClient()

  if (orderIds.length === 0) {
    return new Map<string, LabResultRow>()
  }

  const { data, error } = await admin
    .from("lab_results")
    .select("file_url, findings, id, is_abnormal, lab_order_id, notes, reported_at, result_summary")
    .in("lab_order_id", orderIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map((data ?? []).map((result: LabResultRow) => [result.lab_order_id, result]))
}

function mergeOrderWithResult({
  order,
  patientLookup,
  providerLookup,
  result,
}: {
  order: LabOrderRow
  patientLookup: Map<string, { patientId: string; patientName: string }>
  providerLookup: Map<string, string>
  result?: LabResultRow
}): ProviderLabOrderListItem {
  return {
    appointmentId: order.appointment_id,
    fileUrl: result?.file_url ?? null,
    findings: result?.findings ?? null,
    id: order.id,
    instructions: order.instructions,
    isAbnormal: result?.is_abnormal ?? false,
    notes: result?.notes ?? null,
    orderNumber: order.order_number,
    orderedAt: order.ordered_at,
    patientId: patientLookup.get(order.patient_id)?.patientId ?? "Unknown",
    patientName: patientLookup.get(order.patient_id)?.patientName ?? "Patient",
    priority: order.priority,
    providerName: providerLookup.get(order.provider_id) ?? "Provider",
    reportedAt: result?.reported_at ?? null,
    resultId: result?.id ?? null,
    resultSummary: result?.result_summary ?? null,
    status: order.status,
    testName: order.test_name,
    testType: order.test_type,
    updatedAt: order.updated_at,
  }
}

export async function getProviderLabOrders(
  filters?: LabOrderFilter
): Promise<ProviderLabOrderListItem[]> {
  const provider = await getProviderContext()
  const admin = createAdminClient()
  let query = admin
    .from("lab_orders")
    .select(
      "appointment_id, id, instructions, order_number, ordered_at, patient_id, priority, provider_id, status, test_name, test_type, updated_at"
    )
    .eq("provider_id", provider.id)
    .order("ordered_at", { ascending: false })

  if (filters?.status) {
    query = query.eq("status", filters.status)
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority)
  }

  if (filters?.patientId) {
    query = query.eq("patient_id", filters.patientId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const orders = (data ?? []) as LabOrderRow[]

  if (orders.length === 0) {
    return []
  }

  const resultMap = await getLabResultMap(orders.map((order) => order.id))

  const { data: patients, error: patientError } = await admin
    .from("patients")
    .select("id, patient_id, profile_id")
    .in("id", orders.map((order) => order.patient_id))

  if (patientError) {
    throw new Error(patientError.message)
  }

  const patientRows = (patients ?? []) as PatientLookupRow[]
  const patientNames = await getProfileNames(patientRows.map((patient) => patient.profile_id))
  const providerNames = await getProfileNames([provider.profile_id])
  const patientLookup = new Map(
    patientRows.map((patient) => [
      patient.id,
      {
        patientId: patient.patient_id,
        patientName: patientNames.get(patient.profile_id) ?? "Patient",
      },
    ])
  )
  const providerLookup = new Map([[provider.id, providerNames.get(provider.profile_id) ?? "Provider"]])

  return orders.map((order) =>
    mergeOrderWithResult({
      order,
      patientLookup,
      providerLookup,
      result: resultMap.get(order.id),
    })
  )
}

export async function getProviderLabOrderDetail(
  orderId: string
): Promise<ProviderLabOrderDetail | null> {
  const provider = await getProviderContext()
  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from("lab_orders")
    .select(
      "appointment_id, id, instructions, order_number, ordered_at, patient_id, priority, provider_id, status, test_name, test_type, updated_at"
    )
    .eq("id", orderId)
    .eq("provider_id", provider.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!order) {
    return null
  }

  const [resultMap, patientRowResult, providerNames] = await Promise.all([
    getLabResultMap([order.id]),
    admin
      .from("patients")
      .select("id, patient_id, profile_id")
      .eq("id", order.patient_id)
      .maybeSingle(),
    getProfileNames([provider.profile_id]),
  ])

  if (patientRowResult.error || !patientRowResult.data) {
    throw new Error(patientRowResult.error?.message ?? "Patient not found.")
  }

  const patientNameMap = await getProfileNames([patientRowResult.data.profile_id])
  const result = resultMap.get(order.id)

  return {
    findings: result?.findings ?? null,
    fileUrl: result?.file_url ?? null,
    id: order.id,
    instructions: order.instructions,
    isAbnormal: result?.is_abnormal ?? false,
    notes: result?.notes ?? null,
    orderNumber: order.order_number,
    orderedAt: order.ordered_at,
    patientId: patientRowResult.data.id,
    patientName: patientNameMap.get(patientRowResult.data.profile_id) ?? "Patient",
    patientRecordId: patientRowResult.data.patient_id,
    priority: order.priority,
    providerName: providerNames.get(provider.profile_id) ?? "Provider",
    reportedAt: result?.reported_at ?? null,
    resultSummary: result?.result_summary ?? null,
    status: order.status,
    testName: order.test_name,
    testType: order.test_type,
    timeline: [
      {
        date: order.ordered_at,
        description: "Lab order created.",
        title: "Ordered",
      },
      ...(order.status !== "ordered"
        ? [
            {
              date: order.updated_at,
              description: `Order moved to ${order.status.replace("_", " ")}.`,
              title: "Status Updated",
            },
          ]
        : []),
      ...(result
        ? [
            {
              date: result.reported_at,
              description: result.result_summary,
              title: result.is_abnormal ? "Abnormal Result Reported" : "Result Reported",
            },
          ]
        : []),
    ],
    updatedAt: order.updated_at,
  }
}

export async function getPatientLabOrders(patientId: string): Promise<PatientLabListItem[]> {
  const patient = await getPatientContext()

  if (patient.id !== patientId) {
    throw new Error("Unauthorized")
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("lab_orders")
    .select(
      "appointment_id, id, instructions, order_number, ordered_at, patient_id, priority, provider_id, status, test_name, test_type, updated_at"
    )
    .eq("patient_id", patientId)
    .order("ordered_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const orders = (data ?? []) as LabOrderRow[]

  if (orders.length === 0) {
    return []
  }

  const resultMap = await getLabResultMap(orders.map((order) => order.id))
  const { data: providers, error: providerError } = await admin
    .from("providers")
    .select("id, profile_id")
    .in("id", orders.map((order) => order.provider_id))

  if (providerError) {
    throw new Error(providerError.message)
  }

  const providerRows = (providers ?? []) as ProviderLookupRow[]
  const providerNames = await getProfileNames(providerRows.map((provider) => provider.profile_id))
  const providerLookup = new Map(
    providerRows.map((provider) => [provider.id, providerNames.get(provider.profile_id) ?? "Provider"])
  )

  return orders.map((order) => {
    const result = resultMap.get(order.id)

    return {
      fileUrl: result?.file_url ?? null,
      findings: result?.findings ?? null,
      id: order.id,
      instructions: order.instructions,
      isAbnormal: result?.is_abnormal ?? false,
      notes: result?.notes ?? null,
      orderNumber: order.order_number,
      orderedAt: order.ordered_at,
      providerName: providerLookup.get(order.provider_id) ?? "Provider",
      priority: order.priority,
      reportedAt: result?.reported_at ?? null,
      resultSummary: result?.result_summary ?? null,
      status: order.status,
      testName: order.test_name,
      testType: order.test_type,
    }
  })
}

export async function getOrderLabPatients(): Promise<OrderLabPatientOption[]> {
  const provider = await getProviderContext()
  const admin = createAdminClient()
  const { data: patients, error } = await admin
    .from("patients")
    .select("id, patient_id, profile_id, primary_provider_id")
    .eq("primary_provider_id", provider.id)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const patientRows = (patients ?? []) as Array<
    PatientLookupRow & Pick<Tables<"patients">, "primary_provider_id">
  >
  const names = await getProfileNames(patientRows.map((patient) => patient.profile_id))

  return patientRows.map((patient) => ({
    id: patient.id,
    patientId: patient.patient_id,
    patientName: names.get(patient.profile_id) ?? "Patient",
  }))
}
