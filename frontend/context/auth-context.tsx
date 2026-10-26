"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { TokenResponse, User } from "@/types/auth"
import { authKeys } from "@/hooks/auth/query-keys"
import { useCurrentUser } from "@/hooks/auth/use-user"

import {
  COOKIE_KEYS,
  clearAuthCookies,
  getCookie,
  setAuthCookies,
  subscribeToAuth,
} from "@/lib/cookies"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (tokens: TokenResponse, user: User) => void
  logout: () => void
  refetchUser: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

function getStoredToken() {
  if (typeof window === "undefined") return null
  return getCookie(COOKIE_KEYS.ACCESS_TOKEN)
}

function getServerSnapshot() {
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const token = React.useSyncExternalStore(
    subscribeToAuth,
    getStoredToken,
    getServerSnapshot
  )
  const { data: user, isLoading, refetch } = useCurrentUser()

  const login = React.useCallback(
    (tokens: TokenResponse, userData: User) => {
      setAuthCookies(tokens)
      queryClient.setQueryData(authKeys.me(), userData)
    },
    [queryClient]
  )

  const logout = React.useCallback(() => {
    clearAuthCookies()
    queryClient.removeQueries({ queryKey: authKeys.all })
    router.push("/auth/sign-in")
  }, [queryClient, router])

  const isAuthenticated = Boolean(token || user)

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: Boolean(token) && isLoading,
        isAuthenticated,
        login,
        logout,
        refetchUser: () => {
          refetch()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
