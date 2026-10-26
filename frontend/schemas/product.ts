import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Tên sản phẩm phải có ít nhất 2 ký tự")
    .max(255, "Tên sản phẩm không được vượt quá 255 ký tự"),
  price: z.coerce
    .number()
    .min(0, "Giá tiền không được là số âm")
    .max(10000000000, "Giá tiền vượt quá giới hạn cho phép"),
  image: z
    .string()
    .min(5, "Đường dẫn ảnh không được để trống")
    .max(500, "Đường dẫn ảnh quá dài")
    .url("Vui lòng nhập đường dẫn URL ảnh hợp lệ (http:// hoặc https://)"),
});

export type ProductFormValues = z.infer<typeof productSchema>;
