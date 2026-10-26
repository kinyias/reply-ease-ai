import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Routes that require authentication.
 * Unauthenticated users will be redirected to /auth/sign-in.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/portal", "/settings"]

/**
 * Authentication routes for guests only.
 * Authenticated users will be redirected to /dashboard.
 */
const AUTH_PREFIXES = ["/auth"]

/**
 * Next.js 16 Proxy function (formerly middleware).
 * Intercepts requests to enforce authentication checks based on cookies.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  const isAuthPath = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  // 1. Unauthenticated users attempting to access protected routes
  if (isProtectedPath && !accessToken) {
    const signInUrl = new URL("/auth/sign-in", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 2. Authenticated users attempting to access login / register pages
  if (isAuthPath && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export default proxy

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - images and fonts (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.webp, *.woff, *.woff2)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2)$).*)",
  ],
}
