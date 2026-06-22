// backend/src/models/contracts.model.ts
import { z } from "zod";
import { createQuerySchema } from "./query.model";

// ==================== Zod Schemas ====================

export const updateContractSchema = z.object({
  charged: z.number().min(0).optional(),
  // Баланс обычно пересчитывается автоматически, но если нужно ручное вмешательство:
  balance: z.number().optional(),
});

export const createContractSchema = z.object({
  client_id: z.number({ required_error: "Client ID є обов'язковим" }),
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Період повинен бути у форматі YYYY-MM"),
  contract_number: z.string().min(1, "Номер договору є обов'язковим"),
  charged: z
    .number()
    .min(0, "Сума нарахування не може бути від'ємною")
    .default(0),
});

export const contractResponseSchema = z.object({
  id: z.number(),
  client_id: z.number(),
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Період повинен бути у форматі YYYY-MM"),
  contract_number: z.string(),
  charged: z.number().or(z.string()), // Часто DB возвращает decimal как строку
  paid: z.number().or(z.string()),
  balance: z.number().or(z.string()),
  created_at: z.date().or(z.string()),
  updated_at: z.date().or(z.string()).optional(),
});

export const contractListResponseSchema = z.array(contractResponseSchema);
// Refine параметри
export const contractQuerySchema = createQuerySchema(
  ["id", "client_id", "period", "contract_number"],
  "contract_number",
);

// Фільтри
export const contractFilterSchema = z.object({
  q: z.string().max(100).optional(),
  id: z.coerce.number().optional(),
  client_id: z.coerce.number().optional(),
  period: z.coerce.string().optional(),
  balance: z.coerce.number().optional(),
  balance_gte: z.coerce.number().optional(),
  balance_lte: z.coerce.number().optional(),
});

// ==================== TypeScript Types ====================

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type Contract = z.infer<typeof contractResponseSchema>;

// Для параметров в роутах
export type ContractIdParams = { id: number };
export type ClientIdParams = { clientId: number };

// JSON Schema для Fastify (для валидации параметров в URL)
export const contractIdSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "integer" },
  },
};
