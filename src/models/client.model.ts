// backend/src/models/client.model.ts
import { z } from "zod";

// ==================== Zod Schemas ====================

export const createClientSchema = z.object({
  name: z.string().min(2, "Ім'я повинно бути не менше 2 символів"),
  phone: z.string().min(10, "Некоректний номер телефону"),
  password: z.string().min(6, "Пароль повинен містити мінімум 6 символів"),
});

export const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  is_active: z.boolean().optional(),
});

export const clientResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  is_active: z.boolean(),
  created_at: z.date().or(z.string()),
  updated_at: z.date().or(z.string()).optional(),
});

// ==================== TypeScript Types ====================

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type Client = z.infer<typeof clientResponseSchema>;

export const clientIdSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer" },
  },
};

export type ClientIdParams = { id: number };
