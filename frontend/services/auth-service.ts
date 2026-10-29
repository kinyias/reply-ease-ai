import apiClient from "@/lib/api-client"
import { clearAuthCookies } from "@/lib/cookies"
import {
  AuthActionResponse,
  ForgotPasswordRequest,
  GenerateOtpRequest,
  GenerateOtpResponse,
  LoginRequest,
  LoginSuccessResponse,
  RegisterSuccessResponse,
  ResetPasswordRequest,
  TokenResponse,
  User,
  VerifyOtpRequest,
  VerifyResetOtpRequest,
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

  /**
   * Log out and clear authentication cookies
   */
  logout(): void {
    clearAuthCookies()
  },

  /**
   * Initialize a sandbox demo session
   */
  async createDemoSession(): Promise<LoginSuccessResponse> {
    const response = await apiClient.post<LoginSuccessResponse>(
      "/auth/demo-session"
    )
    return response.data
  },

  /**
   * Terminate current demo session and clean up all ephemeral records
   */
  async terminateDemoSession(): Promise<{ status: number; message: string }> {
    const response = await apiClient.post<{ status: number; message: string }>(
      "/auth/demo-session/terminate"
    )
    return response.data
  },

  /**
   * Send password reset OTP to email
   */
  async forgotPassword(
    payload: ForgotPasswordRequest
  ): Promise<AuthActionResponse> {
    const response = await apiClient.post<AuthActionResponse>(
      "/auth/forgot-password",
      payload
    )
    return response.data
  },

  /**
   * Verify password reset OTP
   */
  async verifyResetOtp(
    payload: VerifyResetOtpRequest
  ): Promise<AuthActionResponse> {
    const response = await apiClient.post<AuthActionResponse>(
      "/auth/forgot-password/verify-otp",
      payload
    )
    return response.data
  },

  /**
   * Reset password with OTP and new password
   */
  async resetPassword(
    payload: ResetPasswordRequest
  ): Promise<AuthActionResponse> {
    const response = await apiClient.post<AuthActionResponse>(
      "/auth/reset-password",
      payload
    )
    return response.data
  },
}
