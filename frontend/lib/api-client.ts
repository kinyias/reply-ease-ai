import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import {
  COOKIE_KEYS,
  clearAuthCookies,
  getCookie,
  setAuthCookies,
} from "./cookies"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// Request Interceptor: Attach Access Token from cookies
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = getCookie(COOKIE_KEYS.ACCESS_TOKEN)
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      if (typeof window !== "undefined") {
        const refreshToken = getCookie(COOKIE_KEYS.REFRESH_TOKEN)
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            )

            const { access_token, refresh_token: newRefreshToken } =
              refreshResponse.data

            setAuthCookies({
              access_token,
              refresh_token: newRefreshToken || refreshToken,
            })

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`
            }

            return apiClient(originalRequest)
          } catch {
            // Refresh token expired or invalid -> logout user and clear cookies
            clearAuthCookies()
            if (
              !window.location.pathname.startsWith("/auth") &&
              !window.location.pathname.startsWith("/portal") &&
              !window.location.pathname.startsWith("/chatbot")
            ) {
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.href = "/auth/sign-in"
            }
          }
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
