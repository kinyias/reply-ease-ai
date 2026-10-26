import { AxiosError } from "axios"

export function getApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again later."
): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") {
      return detail
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0]
      if (typeof first === "object" && first !== null && "msg" in first) {
        return String(first.msg)
      }
    }
    if (error.response?.data?.message) {
      return String(error.response.data.message)
    }
    if (error.message) {
      if (error.code === "ERR_NETWORK") {
        return "Unable to connect to the server. Please check your internet connection."
      }
      return error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
