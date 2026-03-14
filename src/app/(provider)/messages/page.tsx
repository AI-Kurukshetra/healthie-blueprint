import { EmptyState } from "@/components/shared/EmptyState"
import { MessagingWorkspace } from "@/components/messages/MessagingWorkspace"
import { getShellData } from "@/lib/data/app-shell"
import { getMessagingData } from "@/lib/data/messages"

export default async function ProviderMessagesPage() {
  const shell = await getShellData("provider")

  if (!shell.provider) {
    return (
      <EmptyState
        description="Your provider profile could not be loaded for this account."
        title="Provider profile missing"
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
