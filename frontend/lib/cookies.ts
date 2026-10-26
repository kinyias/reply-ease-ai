export const COOKIE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const

export interface CookieOptions {
  maxAge?: number // in seconds
  path?: string
  sameSite?: "Lax" | "Strict" | "None"
  secure?: boolean
}

/**
 * Retrieve a cookie value by name in client-side runtime
 */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null

  const nameEq = `${encodeURIComponent(name)}=`
  const cookies = document.cookie.split(";")

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1)
    }
    if (cookie.indexOf(nameEq) === 0) {
      const rawVal = cookie.substring(nameEq.length)
      try {
        return decodeURIComponent(rawVal)
      } catch {
        return rawVal
      }
    }
  }

  return null
}

/**
 * Set a cookie with options (path, max-age, SameSite, Secure)
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (typeof document === "undefined") return

  const {
    maxAge,
    path = "/",
    sameSite = "Lax",
    secure = process.env.NODE_ENV === "production",
  } = options

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`

  if (typeof maxAge === "number") {
    cookieString += `; max-age=${maxAge}`
    const expires = new Date(Date.now() + maxAge * 1000)
    cookieString += `; expires=${expires.toUTCString()}`
  }

  if (secure) {
    cookieString += "; Secure"
  }

  document.cookie = cookieString
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string, path: string = "/"): void {
  if (typeof document === "undefined") return
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
}

/**
 * Get configured Access Token cookie max-age from environment variable
 * Defaults to 86400 seconds (24 hours) if not configured
 */
export function getAccessTokenMaxAge(): number {
  const envVal = process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_MAX_AGE
  const parsed = envVal ? parseInt(envVal, 10) : NaN
  return !isNaN(parsed) && parsed > 0 ? parsed : 86400
}

/**
 * Get configured Refresh Token cookie max-age from environment variable
 * Defaults to 604800 seconds (7 days) if not configured
 */
export function getRefreshTokenMaxAge(): number {
  const envVal = process.env.NEXT_PUBLIC_REFRESH_TOKEN_COOKIE_MAX_AGE
  const parsed = envVal ? parseInt(envVal, 10) : NaN
  return !isNaN(parsed) && parsed > 0 ? parsed : 604800
}

/**
 * Store access_token and refresh_token in browser cookies with configured expiration times.
 * Dispatches an event to notify reactive auth listeners.
 */
export function setAuthCookies(tokens: {
  access_token: string
  refresh_token?: string
}): void {
  if (typeof window === "undefined") return

  setCookie(COOKIE_KEYS.ACCESS_TOKEN, tokens.access_token, {
    maxAge: getAccessTokenMaxAge(),
  })

  if (tokens.refresh_token) {
    setCookie(COOKIE_KEYS.REFRESH_TOKEN, tokens.refresh_token, {
      maxAge: getRefreshTokenMaxAge(),
    })
  }

  // Clear legacy localStorage entries to avoid sync conflicts
  try {
    localStorage.removeItem(COOKIE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN)
  } catch {
    // Ignore in restrictive storage environments
  }

  window.dispatchEvent(new Event("auth-token-changed"))
}

/**
 * Clear authentication cookies and legacy localStorage tokens.
 * Dispatches an event to notify reactive auth listeners.
 */
export function clearAuthCookies(): void {
  if (typeof window === "undefined") return

  removeCookie(COOKIE_KEYS.ACCESS_TOKEN)
  removeCookie(COOKIE_KEYS.REFRESH_TOKEN)

  try {
    localStorage.removeItem(COOKIE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(COOKIE_KEYS.REFRESH_TOKEN)
  } catch {
    // Ignore in restrictive storage environments
  }

  window.dispatchEvent(new Event("auth-token-changed"))
}

/**
 * Subscribe to auth token changes (cookie change events & cross-tab storage events)
 */
export function subscribeToAuth(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  window.addEventListener("auth-token-changed", callback)
  window.addEventListener("storage", callback)

  return () => {
    window.removeEventListener("auth-token-changed", callback)
    window.removeEventListener("storage", callback)
  }
}
