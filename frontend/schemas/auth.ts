import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email address" })
    .email({ message: "Invalid email address format" }),
  password: z
    .string()
    .min(1, { message: "Please enter your password" }),
  rememberMe: z.boolean().default(false).optional(),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const userTypeSchema = z.enum(["owner", "student"])
export type UserTypeValue = z.infer<typeof userTypeSchema>

export const signUpStep1Schema = z
  .object({
    type: z.enum(["owner", "student"]).default("owner"),
    fullname: z
      .string()
      .min(3, { message: "Full name must be at least 3 characters" })
      .max(100, { message: "Full name must not exceed 100 characters" }),
    email: z
      .string()
      .min(1, { message: "Please enter your email" })
      .email({ message: "Invalid email address format" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(64, { message: "Password must not exceed 64 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "You must agree to the Terms of Service and Privacy Policy",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpStep1FormValues = z.infer<typeof signUpStep1Schema>

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "OTP code must be exactly 6 digits" })
    .regex(/^\d+$/, { message: "OTP code must contain only numbers" }),
})

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>
