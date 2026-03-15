"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, HeartPulse, ShieldCheck, Stethoscope, UserRound } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { registerAction } from "@/actions/auth"
import { DatePicker } from "@/components/shared/DatePicker"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormMessage } from "@/components/ui/form-message"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  registerFormSchema,
  type RegisterFormInput,
  type RegisterRole,
} from "@/lib/validations/auth"

const roleCards: Array<{
  description: string
  icon: typeof Stethoscope
  role: RegisterRole
  title: string
}> = [
  {
    role: "provider",
    title: "I am a Provider",
    description: "Doctor, therapist, or clinician managing patient care.",
    icon: Stethoscope,
  },
  {
    role: "patient",
    title: "I am a Patient",
    description: "Looking for appointments, records, and secure messaging.",
    icon: UserRound,
  },
]

export function RegisterForm() {
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<RegisterRole>("patient")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [formSuccess, setFormSuccess] = useState<string>()

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: "patient",
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      date_of_birth: "",
      gender: undefined,
      consent_treatment: false,
      consent_telehealth: false,
      consent_terms: false,
      specialty: "",
      license_number: "",
      license_state: "",
    },
  })
  const selectedGender = useWatch({
    control: form.control,
    name: "gender",
  })

  const preserveSharedValues = () => ({
    full_name: form.getValues("full_name"),
    email: form.getValues("email"),
    password: form.getValues("password"),
    confirm_password: form.getValues("confirm_password"),
    phone: form.getValues("phone"),
  })

  const handleRoleChange = (nextRole: RegisterRole) => {
    setRole(nextRole)
    setFormError(undefined)
    setFormSuccess(undefined)

    if (nextRole === "provider") {
      form.reset({
        role: nextRole,
        ...preserveSharedValues(),
        date_of_birth: "",
        gender: undefined,
        consent_treatment: false,
        consent_telehealth: false,
        consent_terms: false,
        specialty: "",
        license_number: "",
        license_state: "",
      })
      return
    }

    form.reset({
      role: nextRole,
      ...preserveSharedValues(),
      date_of_birth: "",
      gender: undefined,
      consent_treatment: false,
      consent_telehealth: false,
      consent_terms: false,
      specialty: "",
      license_number: "",
      license_state: "",
    })
  }

  const consentError =
    form.formState.errors.consent_treatment?.message ||
    form.formState.errors.consent_telehealth?.message ||
    form.formState.errors.consent_terms?.message

  const handleSubmit = (values: RegisterFormInput) => {
    setFormError(undefined)
    setFormSuccess(undefined)

    startTransition(async () => {
      const result = await registerAction(values)

      if (!result) {
        return
      }

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.[0]) {
            return
          }

          form.setError(field as keyof RegisterFormInput, {
            type: "server",
            message: messages[0],
          })
        })
      }

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
      }

      if (result.success) {
        setFormSuccess(result.success)
        toast.success(result.success)
      }
    })
  }

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">Choose your role</p>
          <p className="text-sm text-slate-500">
            Your role controls the dashboard and records created during signup.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {roleCards.map(({ description, icon: Icon, role: optionRole, title }) => (
            <button
              key={optionRole}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]",
                role === optionRole
                  ? "border-2 border-[var(--teal)] bg-[var(--teal-light)] shadow-[0_0_0_3px_rgba(0,212,184,0.12)]"
                  : "border-2 border-[#E2E8F0] bg-white hover:border-[var(--teal)]/35 hover:bg-[var(--teal-light)]"
              )}
              onClick={() => handleRoleChange(optionRole)}
              type="button"
            >
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--teal-light)] text-[var(--teal-dark)]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-base font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </button>
          ))}
        </div>
      </div>

      <input type="hidden" {...form.register("role")} value={role} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="register-name">Full Name</Label>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder="Enter your full name"
            {...form.register("full_name")}
          />
          <FormMessage message={form.formState.errors.full_name?.message} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            autoComplete="email"
            placeholder="you@healthflow.com"
            {...form.register("email")}
          />
          <FormMessage message={form.formState.errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              autoComplete="new-password"
              className="pr-11"
              placeholder="Create a password"
              type={showPassword ? "text" : "password"}
              {...form.register("password")}
            />
            <Button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2 text-[var(--text-hint)] hover:text-[var(--teal)]"
              onClick={() => setShowPassword((value) => !value)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <FormMessage message={form.formState.errors.password?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="register-confirm-password"
              autoComplete="new-password"
              className="pr-11"
              placeholder="Re-enter your password"
              type={showConfirmPassword ? "text" : "password"}
              {...form.register("confirm_password")}
            />
            <Button
              aria-label={
                showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"
              }
              className="absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2 text-[var(--text-hint)] hover:text-[var(--teal)]"
              onClick={() => setShowConfirmPassword((value) => !value)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <FormMessage message={form.formState.errors.confirm_password?.message} />
        </div>

        {role === "patient" ? (
          <div className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:col-span-2">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-950">Consent & Agreements</h3>
              <p className="text-sm text-slate-600">
                Review and accept the required agreements before continuing.
              </p>
            </div>

            <Controller
              control={form.control}
              name="consent_treatment"
              render={({ field }) => (
                <label className="flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4">
                  <Checkbox
                    checked={field.value}
                    id="consent-treatment"
                    onCheckedChange={field.onChange}
                  />
                  <span className="space-y-1 text-sm text-slate-600">
                    <span className="block font-medium text-slate-950">
                      I consent to treatment and collection of my health data as per the
                      Privacy Policy
                    </span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Required
                    </span>
                  </span>
                </label>
              )}
            />

            <Controller
              control={form.control}
              name="consent_telehealth"
              render={({ field }) => (
                <label className="flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4">
                  <Checkbox
                    checked={field.value}
                    id="consent-telehealth"
                    onCheckedChange={field.onChange}
                  />
                  <span className="space-y-1 text-sm text-slate-600">
                    <span className="block font-medium text-slate-950">
                      I agree to receive telehealth consultations via video, phone, or
                      messaging
                    </span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Required
                    </span>
                  </span>
                </label>
              )}
            />

            <Controller
              control={form.control}
              name="consent_terms"
              render={({ field }) => (
                <label className="flex items-start gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4">
                  <Checkbox
                    checked={field.value}
                    id="consent-terms"
                    onCheckedChange={field.onChange}
                  />
                  <span className="space-y-1 text-sm text-slate-600">
                    <span className="block font-medium text-slate-950">
                      I have read and agree to the Terms of Service
                    </span>
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Required
                    </span>
                  </span>
                </label>
              )}
            />

            <FormMessage message={consentError} />
          </div>
        ) : null}

        <div className={cn("space-y-2", role === "patient" ? "" : "sm:col-span-2")}>
          <Label htmlFor="register-phone">Phone</Label>
          <Input
            id="register-phone"
            autoComplete="tel"
            placeholder="9876543210"
            {...form.register("phone")}
          />
          <FormMessage message={form.formState.errors.phone?.message} />
        </div>

        {role === "patient" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="register-dob">Date of Birth</Label>
              <Controller
                control={form.control}
                name="date_of_birth"
                render={({ field, fieldState }) => (
                  <DatePicker
                    maxDate={new Date()}
                    onChange={field.onChange}
                    placeholder="Select your date of birth"
                    value={field.value}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-gender">Gender</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("gender", value as RegisterFormInput["gender"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={selectedGender ?? ""}
              >
                <SelectTrigger id="register-gender" className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage message={form.formState.errors.gender?.message} />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="register-specialty">Specialty</Label>
              <Input
                id="register-specialty"
                placeholder="Cardiology"
                {...form.register("specialty")}
              />
              <FormMessage message={form.formState.errors.specialty?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-license-number">License Number</Label>
              <Input
                id="register-license-number"
                placeholder="MH-2026-001"
                {...form.register("license_number")}
              />
              <FormMessage message={form.formState.errors.license_number?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-license-state">License State</Label>
              <Input
                id="register-license-state"
                placeholder="Maharashtra"
                {...form.register("license_state")}
              />
              <FormMessage message={form.formState.errors.license_state?.message} />
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--teal-dark)] shadow-sm">
            {role === "provider" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <HeartPulse className="h-5 w-5" />
            )}
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-950">
              {role === "provider" ? "Provider onboarding" : "Patient onboarding"}
            </p>
            <p className="text-sm leading-6 text-slate-600">
              {role === "provider"
                ? "Your provider profile and practice record will be created automatically after signup."
                : "Your profile and patient chart will be created automatically after signup."}
            </p>
          </div>
        </div>
      </div>

      <FormMessage className="hf-alert-error" message={formError} />
      <FormMessage
        className="hf-alert-success"
        message={formSuccess}
        variant="success"
      />

      <LoadingButton
        className="w-full"
        isLoading={isPending}
        loadingText="Creating account..."
        type="submit"
      >
        {role === "provider" ? "Create Provider Account" : "Create Patient Account"}
      </LoadingButton>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-[var(--teal-dark)] transition hover:text-[var(--teal)]"
          href="/login"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}

