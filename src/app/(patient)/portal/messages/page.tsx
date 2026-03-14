import { MessagingWorkspace } from "@/components/messages/MessagingWorkspace"
import { EmptyState } from "@/components/shared/EmptyState"
import { getShellData } from "@/lib/data/app-shell"
import { getMessagingData } from "@/lib/data/messages"

export default async function PortalMessagesPage() {
  const shell = await getShellData("patient")

  if (!shell.patient) {
    return (
      <EmptyState
        description="We could not load your patient record for this account."
        title="Patient profile missing"
      />
    )
  }

  const messaging = await getMessagingData(shell.userId)

  return (
    <MessagingWorkspace
      currentUserId={shell.userId}
      initialMessages={messaging.messages}
      participants={messaging.participants}
    />
  )
}
