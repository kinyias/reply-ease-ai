import apiClient from "@/lib/api-client"
import {
  GenerateOtpRequest,
  GenerateOtpResponse,
  LoginRequest,
  LoginSuccessResponse,
  RegisterSuccessResponse,
  TokenResponse,
  User,
  VerifyOtpRequest,
} from "@/types/auth"

export const authService = {
  /**
   * Log in with email and password
   */
  async login(payload: LoginRequest): Promise<LoginSuccessResponse> {
    const response = await apiClient.post<LoginSuccessResponse>(
      "/auth/login",
      payload
    )
    return response.data
  },

  /**
   * Generate and send registration OTP to email
   */
  async generateOtp(payload: GenerateOtpRequest): Promise<GenerateOtpResponse> {
    const response = await apiClient.post<GenerateOtpResponse>(
      "/auth/register/generate-otp",
      payload
    )
    return response.data
  },

  /**
   * Verify OTP and complete registration
   */
  async verifyAndRegister(
    payload: VerifyOtpRequest
  ): Promise<RegisterSuccessResponse> {
    const response = await apiClient.post<RegisterSuccessResponse>(
      "/auth/register/verify",
      payload
    )
    return response.data
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    })
    return response.data
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<User>("/auth/me")
    return response.data
  },
}
