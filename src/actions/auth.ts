"use server"

import { redirect } from "next/navigation"
import type { AuthError } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, registerSchema, type RegisterInput } from "@/lib/validations/auth"

type FieldErrors = Record<string, string[] | undefined>

export type AuthActionResult = {
  error?: string
  fieldErrors?: FieldErrors
  success?: string
}

function getRoleHome(role: string | undefined) {
  return role === "patient" ? "/portal" : "/dashboard"
}

function cleanOptional(value?: string | null) {
  if (!value) {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function mapAuthError(error: AuthError) {
  const message = error.message.toLowerCase()

  if (message.includes("invalid login credentials")) {
    return "Invalid email or password"
  }

  if (message.includes("user already registered")) {
    return "An account with this email already exists"
  }

  return error.message
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === "23505"
}

function getRoleLabel(role: string) {
  return role === "provider" ? "provider" : "patient"
}

function buildExistingEmailError(existingRole: string, nextRole: string) {
  if (existingRole === nextRole) {
    return "An account with this email already exists. Please sign in instead."
  }

  return `This email is already registered as a ${getRoleLabel(existingRole)}. Use a different email for a ${getRoleLabel(nextRole)} account.`
}

async function getExistingProfileByEmail(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("id, role")
    .ilike("email", email)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getNextPatientId() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("patients")
    .select("patient_id")
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(error.message)
  }

  const latestValue = data?.[0]?.patient_id
  const latestNumber = latestValue ? Number.parseInt(latestValue.split("-")[1] ?? "0", 10) : 0

  return `PAT-${String(latestNumber + 1).padStart(3, "0")}`
}

async function ensurePatientRecord(userId: string) {
  const admin = createAdminClient()
  const { data: existingPatient, error: existingPatientError } = await admin
    .from("patients")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle()

  if (existingPatientError) {
    throw new Error(existingPatientError.message)
  }

  if (existingPatient) {
    return
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const patientId = await getNextPatientId()
    const { error } = await admin.from("patients").insert({
      patient_id: patientId,
      profile_id: userId,
    })

    if (!error) {
      return
    }

    if (isUniqueViolation(error)) {
      continue
    }

    throw new Error(error.message)
  }

  throw new Error("Unable to allocate a patient ID. Please try again.")
}

async function ensureConsentRecords(userId: string) {
  const admin = createAdminClient()
  const expectedConsentTypes = ["treatment", "telehealth", "data_storage"] as const
  const { data: existingConsents, error: existingConsentsError } = await admin
    .from("consent_records")
    .select("consent_type")
    .eq("patient_profile_id", userId)

  if (existingConsentsError) {
    throw new Error(existingConsentsError.message)
  }

  const existingTypes = new Set(
    (existingConsents ?? []).map((consent) => consent.consent_type)
  )
  const missingConsents = expectedConsentTypes
    .filter((consentType) => !existingTypes.has(consentType))
    .map((consentType) => ({
      consent_type: consentType,
      patient_profile_id: userId,
    }))

  if (missingConsents.length === 0) {
    return
  }

  const { error } = await admin.from("consent_records").insert(missingConsents)

  if (error) {
    throw new Error(error.message)
  }
}

async function finishRegistrationSetup(values: RegisterInput, userId: string) {
  const admin = createAdminClient()

  const profilePayload = {
    id: userId,
    email: values.email,
    full_name: values.full_name,
    role: values.role,
    phone: cleanOptional(values.phone),
    date_of_birth: values.role === "patient" ? cleanOptional(values.date_of_birth) : null,
    gender: values.role === "patient" ? values.gender ?? null : null,
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" })

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (values.role === "provider") {
    const { error: providerError } = await admin.from("providers").upsert(
      {
        profile_id: userId,
        specialty: values.specialty,
        license_number: values.license_number,
        license_state: values.license_state,
      },
      { onConflict: "profile_id" }
    )

    if (providerError) {
      throw new Error(providerError.message)
    }

    return
  }

  await ensurePatientRecord(userId)
  await ensureConsentRecords(userId)
}

async function repairPatientAccountIfNeeded(userId: string, role: string | undefined) {
  if (role !== "patient") {
    return
  }

  await ensurePatientRecord(userId)
  await ensureConsentRecords(userId)
}

export async function loginAction(input: unknown): Promise<AuthActionResult | never> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data)

  if (signInError) {
    return {
      error: mapAuthError(signInError),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: "Unable to verify your session. Please try again.",
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role =
    profile?.role ??
    (typeof user.user_metadata.role === "string" ? user.user_metadata.role : undefined)

  try {
    await repairPatientAccountIfNeeded(user.id, role)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "We couldn't finish loading your patient profile. Please try again.",
    }
  }

  redirect(getRoleHome(role))
}

export async function registerAction(input: unknown): Promise<AuthActionResult | never> {
  const parsed = registerSchema.safeParse(input)

  if (!parsed.success) {
    return {
      error: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const values = {
    ...parsed.data,
    email: parsed.data.email.trim().toLowerCase(),
  }

  try {
    const existingProfile = await getExistingProfileByEmail(values.email)

    if (existingProfile) {
      const message = buildExistingEmailError(existingProfile.role, values.role)

      return {
        error: message,
        fieldErrors: {
          email: [message],
        },
      }
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to validate the email address. Please try again.",
    }
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  const { data, error: createUserError } = await admin.auth.admin.createUser({
    email: values.email,
    email_confirm: true,
    password: values.password,
    user_metadata: {
      full_name: values.full_name,
      role: values.role,
    },
  })

  if (createUserError) {
    return {
      error: mapAuthError(createUserError),
    }
  }

  const userId = data.user?.id

  if (!userId) {
    return {
      error: "Unable to create your account. Please try again.",
    }
  }

  try {
    await finishRegistrationSetup(values, userId)
  } catch (error) {
    console.error("Registration setup failed", error)

    return {
      error:
        values.role === "patient"
          ? "Your account was created, but patient profile setup failed. Please sign in once and we will finish setup automatically."
          : "Your account was created, but profile setup failed. Please contact support.",
    }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  })

  if (signInError) {
    return {
      success: "Account created. Please sign in to continue.",
    }
  }

  redirect(getRoleHome(values.role))
}

export async function logoutAction() {
  const supabase = await createClient()

  await supabase.auth.signOut()
  redirect("/login")
}
