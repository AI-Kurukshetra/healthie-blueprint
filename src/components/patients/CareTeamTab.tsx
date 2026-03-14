"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Stethoscope } from "lucide-react"
import { toast } from "sonner"

import { removeCareTeamMember } from "@/actions/care-team"
import { AddCareTeamDialog } from "@/components/patients/AddCareTeamDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import type {
  CareTeamMember,
  CareTeamProviderOption,
} from "@/lib/data/care-team"
import { formatDate, getInitials } from "@/lib/utils"

type CareTeamTabProps = {
  members: CareTeamMember[]
  patientId: string
  providerOptions: CareTeamProviderOption[]
}

function RemoveCareTeamButton({
  member,
  patientId,
}: {
  member: CareTeamMember
  patientId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Remove
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove care team member?</DialogTitle>
          <DialogDescription>
            Remove Dr. {member.fullName} from this patient&apos;s care team?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            Cancel
          </Button>
          <LoadingButton
            className="bg-rose-600 text-white hover:bg-rose-700"
            isLoading={isPending}
            loadingText="Removing..."
            onClick={() =>
              startTransition(async () => {
                const result = await removeCareTeamMember({
                  patient_id: patientId,
                  provider_id: member.providerId,
                })

                if (result.error) {
                  toast.error(result.error)
                  return
                }

                toast.success("Provider removed from care team.")
                setOpen(false)
                router.refresh()
              })
            }
            type="button"
          >
            Remove
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CareTeamTab({
  members,
  patientId,
  providerOptions,
}: CareTeamTabProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">Care Team</h2>
          <p className="mt-1 text-sm text-slate-500">
            Coordinate specialists and shared responsibility across this patient&apos;s care.
          </p>
        </div>
        <AddCareTeamDialog
          currentProviderIds={members.map((member) => member.providerId)}
          patientId={patientId}
          providerOptions={providerOptions}
        />
      </div>

      {members.length === 0 ? (
        <EmptyState
          description="No care team members yet. Add a provider to start collaboration."
          title="No care team members"
        />
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <article
              key={member.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <Avatar size="lg">
                    <AvatarImage alt={member.fullName} src={member.avatarUrl ?? undefined} />
                    <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {member.fullName}
                      </h3>
                      <StatusBadge value={member.role} />
                    </div>
                    <p className="text-sm text-slate-600">
                      {member.specialty} - {member.licenseNumber}
                    </p>
                    <p className="text-sm text-slate-600">{member.email}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Added {formatDate(member.addedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 lg:flex">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <RemoveCareTeamButton member={member} patientId={patientId} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
