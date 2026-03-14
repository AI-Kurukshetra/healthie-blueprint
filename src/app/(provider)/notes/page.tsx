import { NotesView } from "@/components/notes/NotesView"
import { getProviderNotes } from "@/lib/data/notes"
import { getProviderProfile } from "@/lib/data/provider"
import { createClient } from "@/lib/supabase/server"

export default async function NotesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const provider = await getProviderProfile(user.id)

  if (!provider) {
    return null
  }

  const notes = await getProviderNotes(provider.id)

  return <NotesView notes={notes} />
}
