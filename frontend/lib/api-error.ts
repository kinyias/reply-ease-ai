import { AxiosError } from "axios"

export function getApiErrorMessage(
  error: unknown,
  fallback = "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau."
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
        return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng."
      }
      return error.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
