"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { formatDistanceToNow } from "date-fns"
import {
  Search,
  SendHorizonal,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { useDeferredValue, useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { markThreadReadAction, sendMessageAction } from "@/actions/messages"
import { EmptyState } from "@/components/shared/EmptyState"
import { FetchingOverlay } from "@/components/shared/FetchingOverlay"
import { LoadingButton } from "@/components/shared/LoadingButton"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type {
  MessagingMessage,
  MessagingParticipant,
} from "@/lib/data/messages"
import { messageSchema } from "@/lib/validations/message"
import { cn, formatRelativeTime, getInitials } from "@/lib/utils"
import type { Database } from "@/types/database"

const composerSchema = messageSchema.pick({
  content: true,
})

type ComposerValues = z.infer<typeof composerSchema>

type MessagingWorkspaceProps = {
  currentUserId: string
  initialMessages: MessagingMessage[]
  participants: MessagingParticipant[]
}

type ConversationThread = {
  counterpart: MessagingParticipant
  lastMessage: MessagingMessage | null
  messages: MessagingMessage[]
  unreadCount: number
}

type MessageRecord = Database["public"]["Tables"]["messages"]["Row"]

function upsertMessage(
  messages: MessagingMessage[],
  message: MessagingMessage
): MessagingMessage[] {
  const withoutCurrent = messages.filter((existing) => existing.id !== message.id)

  return [...withoutCurrent, message].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )
}

function getConversationThreads(
  currentUserId: string,
  messages: MessagingMessage[],
  participants: MessagingParticipant[],
  query: string
) {
  const normalizedQuery = query.trim().toLowerCase()
  const participantsById = new Map(participants.map((participant) => [participant.id, participant]))
  const threadsById = new Map<string, ConversationThread>()

  participants.forEach((participant) => {
    threadsById.set(participant.id, {
      counterpart: participant,
      lastMessage: null,
      messages: [],
      unreadCount: 0,
    })
  })

  messages.forEach((message) => {
    const counterpartId =
      message.senderId === currentUserId ? message.receiverId : message.senderId
    const fallbackParticipant =
      participantsById.get(counterpartId) ??
      ({
        avatarUrl: null,
        fullName: "Care team",
        id: counterpartId,
        patientCode: null,
        patientRecordId: message.patientId,
        role: "user",
      } satisfies MessagingParticipant)
    const thread = threadsById.get(counterpartId) ?? {
      counterpart: fallbackParticipant,
      lastMessage: null,
      messages: [],
      unreadCount: 0,
    }

    thread.messages = [...thread.messages, message]

    if (
      !thread.lastMessage ||
      new Date(message.createdAt).getTime() > new Date(thread.lastMessage.createdAt).getTime()
    ) {
      thread.lastMessage = message
    }

    if (
      message.receiverId === currentUserId &&
      message.senderId === counterpartId &&
      !message.isRead
    ) {
      thread.unreadCount += 1
    }

    threadsById.set(counterpartId, thread)
  })

  return [...threadsById.values()]
    .filter((thread) => {
      if (!normalizedQuery) {
        return true
      }

      return (
        thread.counterpart.fullName.toLowerCase().includes(normalizedQuery) ||
        (thread.counterpart.patientCode ?? "").toLowerCase().includes(normalizedQuery) ||
        (thread.lastMessage?.content ?? "").toLowerCase().includes(normalizedQuery)
      )
    })
    .sort((left, right) => {
      const leftTime = left.lastMessage
        ? new Date(left.lastMessage.createdAt).getTime()
        : 0
      const rightTime = right.lastMessage
        ? new Date(right.lastMessage.createdAt).getTime()
        : 0

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return left.counterpart.fullName.localeCompare(right.counterpart.fullName)
    })
}

export function MessagingWorkspace({
  currentUserId,
  initialMessages,
  participants,
}: MessagingWorkspaceProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [query, setQuery] = useState("")
  const [selectedCounterpartId, setSelectedCounterpartId] = useState<string | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const deferredQuery = useDeferredValue(query)
  const form = useForm<ComposerValues>({
    defaultValues: {
      content: "",
    },
    resolver: zodResolver(composerSchema),
  })
  const composerContent = form.watch("content")
  const threads = getConversationThreads(
    currentUserId,
    messages,
    participants,
    deferredQuery
  )
  const activeCounterpartId = threads.some(
    (thread) => thread.counterpart.id === selectedCounterpartId
  )
    ? selectedCounterpartId
    : threads[0]?.counterpart.id ?? null
  const selectedThread =
    threads.find((thread) => thread.counterpart.id === activeCounterpartId) ?? null

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages-feed-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
            return
          }

          const nextMessage = payload.new as MessageRecord

          if (
            nextMessage.sender_id !== currentUserId &&
            nextMessage.receiver_id !== currentUserId
          ) {
            return
          }

          setMessages((current) =>
            upsertMessage(current, {
              content: nextMessage.content,
              createdAt: nextMessage.created_at,
              id: nextMessage.id,
              isRead: nextMessage.is_read,
              patientId: nextMessage.patient_id,
              receiverId: nextMessage.receiver_id,
              senderId: nextMessage.sender_id,
            })
          )
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId])

  async function activateThread(counterpartId: string) {
    const thread = threads.find((item) => item.counterpart.id === counterpartId)

    startTransition(() => setSelectedCounterpartId(counterpartId))

    if (!thread || thread.unreadCount === 0) {
      return
    }

    setMessages((current) =>
      current.map((message) =>
        message.receiverId === currentUserId &&
        message.senderId === counterpartId &&
        !message.isRead
          ? {
              ...message,
              isRead: true,
            }
          : message
      )
    )

    const result = await markThreadReadAction({
      counterpart_id: counterpartId,
    })

    if (result.error) {
      toast.error(result.error)
    }
  }

  async function onSubmit(values: ComposerValues) {
    if (!selectedThread) {
      toast.error("Select a conversation before sending a message.")
      return
    }

    const result = await sendMessageAction({
      content: values.content,
      patient_id: selectedThread.counterpart.patientRecordId ?? undefined,
      receiver_id: selectedThread.counterpart.id,
    })

    if (result.fieldErrors?.content?.[0]) {
      form.setError("content", {
        message: result.fieldErrors.content[0],
      })
    }

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.message) {
      setMessages((current) => upsertMessage(current, result.message!))
      form.reset()
    }
  }

  if (participants.length === 0 && messages.length === 0) {
    return (
      <EmptyState
        description="Your secure message threads will appear here once a patient or provider starts a conversation."
        title="No conversations yet"
      />
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[640px] flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] lg:flex-row">
      <aside className="relative flex max-h-[320px] w-full flex-col border-b border-[var(--border)] lg:max-h-none lg:w-96 lg:border-r lg:border-b-0">
        <div className="border-b border-[var(--border)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--teal-dark)]">Secure inbox</p>
              <h2 className="mt-1 text-2xl font-semibold text-[var(--navy)]">Messages</h2>
            </div>
            <Badge className="rounded-full bg-emerald-50 text-emerald-700">
              Encrypted
            </Badge>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, patient ID, or message"
              value={query}
            />
          </div>
        </div>

        <div className="relative flex-1">
          <FetchingOverlay isVisible={isPending || deferredQuery !== query} />
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              {threads.length === 0 ? (
                <EmptyState
                  description="Try a different search term to find an active conversation."
                  title="No matching conversations"
                />
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.counterpart.id}
                    className={cn(
                      "w-full rounded-3xl border px-4 py-4 text-left transition hover:border-[var(--teal)]/30 hover:bg-[var(--teal-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)]/40",
                      activeCounterpartId === thread.counterpart.id
                        ? "border-[var(--teal)]/30 bg-[var(--teal-light)] border-l-[3px] border-l-[var(--teal)]"
                        : "border-transparent bg-white"
                    )}
                    onClick={() => void activateThread(thread.counterpart.id)}
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar size="lg">
                        <AvatarImage
                          alt={thread.counterpart.fullName}
                          src={thread.counterpart.avatarUrl ?? undefined}
                        />
                        <AvatarFallback>
                          {getInitials(thread.counterpart.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--navy)]">
                              {thread.counterpart.fullName}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <StatusBadge
                                className="px-2 py-0.5 text-[11px]"
                                value={thread.counterpart.role}
                              />
                              {thread.counterpart.patientCode ? (
                                <Badge className="rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]">
                                  {thread.counterpart.patientCode}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            {thread.lastMessage ? (
                              <p className="text-xs text-[var(--text-muted)]">
                                {formatRelativeTime(thread.lastMessage.createdAt)}
                              </p>
                            ) : null}
                            {thread.unreadCount > 0 ? (
                              <span className="mt-2 inline-flex min-w-6 items-center justify-center rounded-full bg-linear-to-br from-[var(--teal)] to-[var(--teal-dark)] px-2 py-0.5 text-xs font-semibold text-white">
                                {thread.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
                          {thread.lastMessage?.content ?? "No messages yet. Start the conversation."}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {selectedThread ? (
          <>
            <header className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar size="lg">
                    <AvatarImage
                      alt={selectedThread.counterpart.fullName}
                      src={selectedThread.counterpart.avatarUrl ?? undefined}
                    />
                    <AvatarFallback>
                      {getInitials(selectedThread.counterpart.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--navy)]">
                      {selectedThread.counterpart.fullName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        Secure conversation
                      </span>
                      {selectedThread.counterpart.patientCode ? (
                        <Badge className="rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]">
                          {selectedThread.counterpart.patientCode}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                {selectedThread.counterpart.patientRecordId ? (
                  <Link
                    className="text-sm font-medium text-[var(--teal-dark)] hover:text-[var(--teal)]"
                    href={
                      selectedThread.counterpart.role === "patient"
                        ? `/patients/${selectedThread.counterpart.patientRecordId}`
                        : "/portal/records"
                    }
                  >
                    {selectedThread.counterpart.role === "patient"
                      ? "Open patient chart"
                      : "Open records"}
                  </Link>
                ) : null}
              </div>
            </header>

            <ScrollArea className="flex-1 bg-[var(--surface)]">
              <div className="space-y-4 p-5">
                {selectedThread.messages.length === 0 ? (
                  <div className="flex h-full min-h-72 items-center justify-center">
                    <EmptyState
                      description="Send the first secure message to open this care thread."
                      title="Conversation ready"
                    />
                  </div>
                ) : (
                  selectedThread.messages.map((message) => {
                    const isCurrentUser = message.senderId === currentUserId

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isCurrentUser ? "justify-end" : "justify-start"
                        )}
                      >
                        <article
                          className={cn(
                            "max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm sm:max-w-[70%]",
                            isCurrentUser
                              ? "bg-linear-to-br from-[var(--teal)] to-[var(--teal-dark)] text-white"
                              : "border border-[var(--border)] bg-white text-slate-700"
                          )}
                        >
                          <p className="text-sm leading-6">{message.content}</p>
                          <p
                            className={cn(
                              "mt-2 text-xs",
                              isCurrentUser ? "text-white/80" : "text-slate-400"
                            )}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </article>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            <form
              className="border-t border-[var(--border)] bg-white p-5"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="space-y-3">
                <Textarea
                  aria-invalid={Boolean(form.formState.errors.content)}
                  className="min-h-28 resize-none rounded-3xl border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                  placeholder={`Message ${selectedThread.counterpart.fullName}`}
                  {...form.register("content")}
                />
                {form.formState.errors.content ? (
                  <p className="text-sm text-rose-600" role="alert">
                    {form.formState.errors.content.message}
                  </p>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--text-muted)]">
                    Messages stay within the HealthFlow care team and patient thread.
                  </p>
                  <LoadingButton
                    className="w-full sm:w-auto"
                    disabled={!composerContent.trim() || form.formState.isSubmitting}
                    isLoading={form.formState.isSubmitting}
                    loadingText="Sending..."
                    type="submit"
                  >
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Send secure message
                  </LoadingButton>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-[var(--surface)] p-6">
            <EmptyState
              description="Choose a conversation from the left panel to review messages or send a new update."
              title="Select a conversation"
            />
          </div>
        )}
      </section>
    </div>
  )
}

