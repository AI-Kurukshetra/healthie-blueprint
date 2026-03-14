"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Search } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { addCareTeamMember } from "@/actions/care-team"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import type { CareTeamProviderOption } from "@/lib/data/care-team"
import {
  careTeamSchema,
  type CareTeamInput,
  type CareTeamRole,
} from "@/lib/validations/care-team"

const roleOptions: CareTeamRole[] = [
  "primary",
  "secondary",
  "specialist",
  "consultant",
]

type AddCareTeamDialogProps = {
  currentProviderIds: string[]
  patientId: string
  providerOptions: CareTeamProviderOption[]
}

export function AddCareTeamDialog({
  currentProviderIds,
  patientId,
  providerOptions,
}: AddCareTeamDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const form = useForm<CareTeamInput>({
    defaultValues: {
      patient_id: patientId,
      provider_id: "",
      role: "secondary",
    },
    resolver: zodResolver(careTeamSchema),
  })

  const availableProviders = providerOptions.filter(
    (provider) => !currentProviderIds.includes(provider.providerId)
  )
  const filteredProviders = availableProviders.filter((provider) => {
    const haystack = `${provider.fullName} ${provider.specialty} ${provider.email}`.toLowerCase()
    return haystack.includes(query.trim().toLowerCase())
  })

  const onSubmit = (values: CareTeamInput) => {
    startTransition(async () => {
      const result = await addCareTeamMember(values)

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages?.[0]) {
            form.setError(field as keyof CareTeamInput, {
              message: messages[0],
              type: "server",
            })
          }
        })
      }

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success("Provider added to care team.")
      setOpen(false)
      form.reset({
        patient_id: patientId,
        provider_id: "",
        role: "secondary",
      })
      setQuery("")
      router.refresh()
    })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button className="rounded-xl bg-sky-500 px-4 text-white hover:bg-sky-600" />
        }
      >
        <Plus className="h-4 w-4" />
        Add Provider
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add provider to care team</DialogTitle>
          <DialogDescription>
            Search the provider roster and assign the appropriate role for this patient.
          </DialogDescription>
        </DialogHeader>

        {availableProviders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            All available providers are already assigned to this care team.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="provider-search">Search providers</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="provider-search"
                  className="pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, specialty, or email"
                  value={query}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Controller
                control={form.control}
                name="provider_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProviders.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          No providers match your search.
                        </div>
                      ) : (
                        filteredProviders.map((provider) => (
                          <SelectItem key={provider.providerId} value={provider.providerId}>
                            {provider.fullName} - {provider.specialty}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMessage message={form.formState.errors.provider_id?.message} />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMessage message={form.formState.errors.role?.message} />
            </div>

            <input type="hidden" {...form.register("patient_id")} value={patientId} />

            <DialogFooter>
              <Button onClick={() => setOpen(false)} type="button" variant="outline">
                Cancel
              </Button>
              <LoadingButton
                className="bg-sky-500 text-white hover:bg-sky-600"
                isLoading={isPending}
                loadingText="Adding..."
                type="submit"
              >
                Add to Care Team
              </LoadingButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
