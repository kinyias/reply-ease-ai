import { z } from "zod";

/**
 * Zod validation schema for creating a new domain.
 * Sanitizes and validates the domain format.
 */
export const createDomainSchema = z.object({
  name: z
    .string()
    .min(2, "Domain name must be at least 2 characters")
    .max(255, "Domain name cannot exceed 255 characters")
    .transform((val) => {
      // Normalize domain name: strip whitespace, remove http/https protocols and trailing slashes
      let cleaned = val.trim().toLowerCase();
      cleaned = cleaned.replace(/^https?:\/\//i, "");
      return cleaned.split("/")[0];
    })
    .refine((val) => val.length >= 2, {
      message: "Please enter a valid domain name (e.g. yourstore.com)",
    }),
  icon: z
    .string()
    .min(1, "Domain icon is required")
    .max(500, "Icon URL is too long"),
});

export type CreateDomainFormValues = z.infer<typeof createDomainSchema>;

/**
 * Zod validation schema for updating an existing domain name.
 */
export const updateDomainSchema = z.object({
  name: z
    .string()
    .min(2, "Domain name must be at least 2 characters")
    .max(255, "Domain name cannot exceed 255 characters")
    .transform((val) => {
      let cleaned = val.trim().toLowerCase();
      cleaned = cleaned.replace(/^https?:\/\//i, "");
      return cleaned.split("/")[0];
    })
    .optional(),
  icon: z.string().max(500).optional(),
});

export type UpdateDomainFormValues = z.infer<typeof updateDomainSchema>;

/**
 * Zod validation schema for customizing chatbot appearance and greetings.
 */
export const updateChatBotSchema = z.object({
  welcome_message: z
    .string()
    .max(1000, "Welcome message cannot exceed 1000 characters")
    .optional(),
  icon: z.string().max(500).optional(),
  background: z.string().max(50).optional(),
  text_color: z.string().max(50).optional(),
  helpdesk: z.boolean().optional(),
});

export type UpdateChatBotFormValues = z.infer<typeof updateChatBotSchema>;
