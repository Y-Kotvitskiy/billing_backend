import { FastifyInstance } from "fastify";
import type { ZodTypeAny } from "zod";
import { PaymentsController } from "../controllers/payments.controller.js";
import {
  Payment,
  paymentListResponseSchema,
  paymentResponseSchema,
} from "../models/payments.model.js";
import { hasRole } from "../middleware/roles.middleware.js";
import { zodToJsonSchema } from "zod-to-json-schema";

const paymentResponseJsonSchema = zodToJsonSchema(
  paymentResponseSchema as ZodTypeAny,
);

const paymentResponseListJsonSchema = zodToJsonSchema(
  paymentListResponseSchema as ZodTypeAny,
);

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: Record<string, any>; // або створити окремий тип
    Reply: Payment[];
  }>(
    "/payments",
    {
      preHandler: [fastify.authenticate, hasRole(["admin"])],
      schema: {
        response: {
          200: paymentListResponseSchema as any,
        },
      },
    },
    PaymentsController.getList,
  );

  fastify.get<{
    Params: { id: string }; // Важно: у вас в URL есть :id, значит Params обязателен
    Reply: Payment;
  }>(
    "/payments/:id",
    {
      preHandler: [fastify.authenticate, hasRole(["admin", "client"])],
      schema: {
        response: {
          200: paymentResponseJsonSchema as any,
        },
      },
    },
    PaymentsController.getOne,
  );

  fastify.get<{
    Querystring: Record<string, any>; // або створити окремий тип
    Reply: Payment[];
  }>(
    "/payments/me",
    {
      preHandler: [fastify.authenticate, hasRole(["client"])],
      schema: {
        response: {
          200: paymentResponseListJsonSchema as any,
        },
      },
    },
    PaymentsController.getMyList,
  );

  // POST /payments
  fastify.post("/payments", PaymentsController.create);
}
