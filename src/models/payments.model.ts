// backend/src/models/payments.model.ts
import { z } from "zod";
import { createQuerySchema } from "./query.model";

export const createPaymentSchema = z.object({
  contract_id: z.number({ required_error: "ID договору є обов'язковим" }),
  client_id: z.number({ required_error: "ID клієнта є обов'язковим" }),
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Формат періоду YYYY-MM"),
  transaction_id: z.string().min(1, "ID транзакції обов'язковий"),
  amount: z.number().positive("Сума платежу повинна бути більше 0"),
});

export const paymentResponseSchema = z.object({
  id: z.number(),
  contract_id: z.number(),
  client_id: z.number(),
  contract_number: z.string(),
  period: z.string(),
  transaction_id: z.string(),
  amount: z.number().or(z.string()),
  created_at: z.date().or(z.string()),
});

export const paymentListResponseSchema = z.array(paymentResponseSchema);

// Refine параметри
export const paymentQuerySchema = createQuerySchema(
  ["id", "period", "contract_number"],
  "created_at",
);

// Фільтри
export const paymentFilterSchema = z.object({
  q: z.string().max(100).optional(),
  client_id: z.coerce.number().optional(),
  contract_id: z.coerce.number().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type Payment = z.infer<typeof paymentResponseSchema>;
