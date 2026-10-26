import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Vui lòng nhập địa chỉ email" })
    .email({ message: "Địa chỉ email không hợp lệ" }),
  password: z
    .string()
    .min(1, { message: "Vui lòng nhập mật khẩu" }),
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
      .min(3, { message: "Họ và tên cần ít nhất 3 ký tự" })
      .max(100, { message: "Họ và tên tối đa 100 ký tự" }),
    email: z
      .string()
      .min(1, { message: "Vui lòng nhập email" })
      .email({ message: "Địa chỉ email không hợp lệ" }),
    password: z
      .string()
      .min(8, { message: "Mật khẩu tối thiểu 8 ký tự" })
      .max(64, { message: "Mật khẩu tối đa 64 ký tự" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Vui lòng xác nhận mật khẩu" }),
    agreeToTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type SignUpStep1FormValues = z.infer<typeof signUpStep1Schema>

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .length(6, { message: "Mã OTP gồm đúng 6 chữ số" })
    .regex(/^\d+$/, { message: "Mã OTP chỉ bao gồm chữ số" }),
})

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>
