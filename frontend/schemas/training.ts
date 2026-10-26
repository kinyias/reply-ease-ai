import { z } from "zod";

export const createHelpDeskSchema = z.object({
  question: z
    .string()
    .min(3, "Câu hỏi phải có ít nhất 3 ký tự")
    .max(1000, "Câu hỏi không được quá 1000 ký tự"),
  answer: z
    .string()
    .min(2, "Câu trả lời phải có ít nhất 2 ký tự")
    .max(5000, "Câu trả lời không được quá 5000 ký tự"),
});

export type CreateHelpDeskFormValues = z.infer<typeof createHelpDeskSchema>;

export const createFilterQuestionSchema = z.object({
  question: z
    .string()
    .min(3, "Câu hỏi lọc phải có ít nhất 3 ký tự")
    .max(1000, "Câu hỏi không được quá 1000 ký tự"),
});

export type CreateFilterQuestionFormValues = z.infer<
  typeof createFilterQuestionSchema
>;
