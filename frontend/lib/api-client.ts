import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token")
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
        const refreshToken = localStorage.getItem("refresh_token")
        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(
              `${API_BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken }
            )

            const { access_token, refresh_token: newRefreshToken } =
              refreshResponse.data

            localStorage.setItem("access_token", access_token)
            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken)
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`
            }

            return apiClient(originalRequest)
          } catch (refreshError) {
            // Refresh token expired or invalid -> logout user
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
            if (
              !window.location.pathname.startsWith("/auth") &&
              !window.location.pathname.startsWith("/portal") &&
              !window.location.pathname.startsWith("/chatbot")
            ) {
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
