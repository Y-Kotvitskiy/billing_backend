import { FastifyInstance } from "fastify";
import { PaymentsController } from "../controllers/payments.controller.js";
import {
  Payment,
  paymentListResponseSchema,
  paymentResponseSchema,
} from "../models/payments.model.js";
import { hasRole } from "../middleware/roles.middleware.js";

export type PaymentListResponse = {
  data: Payment[];
  total: number;
};

export async function paymentsRoutes(fastify: FastifyInstance) {
  // GET /payments?_page=1&_limit=10&_sort=created_at&_order=DESC
  fastify.get<{
    Querystring: Record<string, any>; // або створити окремий тип
    Reply: PaymentListResponse;
  }>(
    "/payments",
    {
      preHandler: [fastify.authenticate, hasRole(["admin"])],
      schema: {
        response: {
          200: paymentListResponseSchema,
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
          //          200: paymentResponseSchema,
        },
      },
    },
    PaymentsController.getOne,
  );

  fastify.get<{
    Querystring: Record<string, any>; // або створити окремий тип
    Reply: PaymentListResponse;
  }>(
    "/payments/me",
    {
      preHandler: [fastify.authenticate, hasRole(["client"])],
      schema: {
        response: {
          //          200: paymentResponseSchema,
        },
      },
    },
    PaymentsController.getMyList,
  );

  // POST /payments
  fastify.post("/payments", PaymentsController.create);
}
