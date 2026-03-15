"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  createPatientAction,
  updatePatientAction,
} from "@/actions/patients"
import { DatePicker } from "@/components/shared/DatePicker"
import { TagsInput } from "@/components/shared/TagsInput"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
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
import {
  patientSchema,
  type PatientFormValues,
} from "@/lib/validations/patient"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const

type PatientFormProps = {
  initialValues?: PatientFormValues
  mode: "create" | "edit"
  patientId?: string
}

const defaultValues: PatientFormValues = {
  allergies: [],
  blood_group: undefined,
  chronic_conditions: [],
  date_of_birth: "",
  email: "",
  emergency_contact: "",
  emergency_phone: "",
  first_name: "",
  gender: undefined,
  insurance_id: "",
  insurance_provider: "",
  last_name: "",
  phone: "",
}

export function PatientForm({
  initialValues = defaultValues,
  mode,
  patientId,
}: PatientFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const form = useForm<PatientFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(patientSchema),
  })

  const onSubmit = (values: PatientFormValues) => {
    setFormError(undefined)

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPatientAction(values)
          : await updatePatientAction(patientId!, values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (!messages?.[0]) {
            return
          }

          form.setError(field as keyof PatientFormValues, {
            message: messages[0],
            type: "server",
          })
        })
      }

      if (result.error) {
        setFormError(result.error)
        toast.error(result.error)
        return
      }

      if (result.patientId) {
        toast.success(mode === "create" ? "Patient added." : "Patient updated.")
        router.push(`/patients/${result.patientId}`)
        router.refresh()
      }
    })
  }

  return (
    <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
      <section className="hf-card">
        <h2 className="hf-card-title">Personal Information</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" {...form.register("first_name")} />
            <FormMessage message={form.formState.errors.first_name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" {...form.register("last_name")} />
            <FormMessage message={form.formState.errors.last_name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <FormMessage message={form.formState.errors.email?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...form.register("phone")} />
            <FormMessage message={form.formState.errors.phone?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Controller
              control={form.control}
              name="date_of_birth"
              render={({ field, fieldState }) => (
                <DatePicker
                  maxDate={new Date()}
                  onChange={field.onChange}
                  placeholder="Select date of birth"
                  value={field.value}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Controller
              control={form.control}
              name="gender"
              render={({ field }) => (
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : value)
                  }
                  value={field.value ?? "none"}
                >
                  <SelectTrigger className="h-10 w-full" id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Prefer not to say</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FormMessage message={form.formState.errors.gender?.message} />
          </div>
        </div>
      </section>

      <section className="hf-card">
        <h2 className="hf-card-title">Medical Information</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="blood_group">Blood Group</Label>
            <Controller
              control={form.control}
              name="blood_group"
              render={({ field }) => (
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : value)
                  }
                  value={field.value ?? "none"}
                >
                  <SelectTrigger className="h-10 w-full" id="blood_group">
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {bloodGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FormMessage message={form.formState.errors.blood_group?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Allergies</Label>
            <Controller
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <TagsInput
                  onChange={field.onChange}
                  placeholder="Add allergy and press Enter"
                  value={field.value ?? []}
                />
              )}
            />
            <FormMessage message={form.formState.errors.allergies?.message as string | undefined} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Chronic Conditions</Label>
            <Controller
              control={form.control}
              name="chronic_conditions"
              render={({ field }) => (
                <TagsInput
                  onChange={field.onChange}
                  placeholder="Add condition and press Enter"
                  value={field.value ?? []}
                />
              )}
            />
            <FormMessage
              message={form.formState.errors.chronic_conditions?.message as string | undefined}
            />
          </div>
        </div>
      </section>

      <section className="hf-card">
        <h2 className="hf-card-title">Emergency Contact</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact">Contact Name</Label>
            <Input id="emergency_contact" {...form.register("emergency_contact")} />
            <FormMessage message={form.formState.errors.emergency_contact?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_phone">Contact Phone</Label>
            <Input id="emergency_phone" {...form.register("emergency_phone")} />
            <FormMessage message={form.formState.errors.emergency_phone?.message} />
          </div>
        </div>
      </section>

      <section className="hf-card">
        <h2 className="hf-card-title">Insurance</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="insurance_provider">Insurance Provider</Label>
            <Input id="insurance_provider" {...form.register("insurance_provider")} />
            <FormMessage message={form.formState.errors.insurance_provider?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insurance_id">Insurance ID</Label>
            <Input id="insurance_id" {...form.register("insurance_id")} />
            <FormMessage message={form.formState.errors.insurance_id?.message} />
          </div>
        </div>
      </section>

      <FormMessage className="hf-alert-error" message={formError} />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href={mode === "create" ? "/patients" : `/patients/${patientId}`}>
          <Button className="w-full sm:w-auto" type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <LoadingButton
          className="w-full sm:w-auto"
          isLoading={isPending}
          loadingText={mode === "create" ? "Adding patient..." : "Saving changes..."}
          type="submit"
        >
          {mode === "create" ? "Add Patient" : "Save Changes"}
        </LoadingButton>
      </div>
    </form>
  )
}

