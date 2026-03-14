import { createServerClient } from "@supabase/ssr"
import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/types/database"

type UpdateSessionResult = {
  authError: AuthError | null
  response: NextResponse
  supabase: SupabaseClient<Database>
  user: User | null
}

export async function updateSession(
  request: NextRequest
): Promise<UpdateSessionResult> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { authError: error, response, supabase, user }
}
