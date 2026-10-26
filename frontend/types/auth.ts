export interface BillingBrief {
  plan: "STANDARD" | "PRO" | "ENTERPRISE" | string
  credits: number
}

export interface DomainBrief {
  id: string
  name: string
  icon: string
}

export interface User {
  id: string
  fullname: string
  email: string
  type: string
  sepay_merchant_id?: string | null
  created_at?: string
  subscription?: BillingBrief | null
  domains?: DomainBrief[]
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface GenerateOtpRequest {
  email: string
  password: string
}

export interface GenerateOtpResponse {
  status: number
  message: string
}

export type UserType = "owner" | "student"

export interface VerifyOtpRequest {
  email: string
  otp: string
  fullname: string
  password: string
  type: UserType | string
}

export interface RegisterSuccessResponse {
  status: number
  message: string
  tokens: TokenResponse
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginSuccessResponse {
  status: number
  message: string
  tokens: TokenResponse
  user: User
}

export interface ApiErrorDetail {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>
}
