import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"]
const PROVIDER_ROUTES = [
  "/dashboard",
  "/patients",
  "/appointments",
  "/notes",
  "/messages",
]
const PATIENT_ROUTES = ["/portal"]
const SHARED_AUTH_ROUTES = ["/consultation"]

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function getRoleHome(role: string | undefined) {
  return role === "patient" ? "/portal" : "/dashboard"
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route))
  const { authError, response, supabase, user } = await updateSession(request)
  const isProviderRoute = PROVIDER_ROUTES.some((route) => matchesRoute(pathname, route))
  const isPatientRoute = PATIENT_ROUTES.some((route) => matchesRoute(pathname, route))
  const isSharedRoute = SHARED_AUTH_ROUTES.some((route) => matchesRoute(pathname, route))

  if (authError && !isPublicRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url))
    redirectResponse.cookies.delete("sb-access-token")
    redirectResponse.cookies.delete("sb-refresh-token")
    return redirectResponse
  }

  if (!user) {
    if (pathname === "/" || !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return response
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const redirectPath = getRoleHome(profile?.role)

  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  if (isSharedRoute) {
    return response
  }

  if (isProviderRoute && profile?.role === "patient") {
    return NextResponse.redirect(new URL("/portal", request.url))
  }

  if (isPatientRoute && profile?.role !== "patient") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
