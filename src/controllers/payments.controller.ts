import { FastifyRequest, FastifyReply, RouteHandler } from "fastify";
import { PaymentsService } from "../services/payments.service.js";
import { createPaymentSchema, Payment } from "../models/payments.model.js";

interface PaymentRoute {
  Params: { id: string };
  Reply: Payment;
}

export class PaymentsController {
  static async getList(
    req: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply,
  ) {
    try {
      const { data, total } = await PaymentsService.getList(req);

      reply.header("x-total-count", total.toString());
      reply.header("Access-Control-Expose-Headers", "x-total-count");
      return reply.send(data);
    } catch (error: any) {
      console.error("Get payment error:", error);

      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Невірні параметри запиту",
          details: error.errors,
        });
      }

      return reply.status(500).send({ error: "Внутрішня помилка сервера" });
    }
  }

  static async getMyList(
    req: FastifyRequest<{ Querystring: any }>,
    reply: FastifyReply,
  ) {
    const clientId = req.user?.id;

    if (!clientId) {
      return reply.code(401).send({ message: "Не авторизовано" });
    }

    try {
      (req as any).enforcedClientId = clientId;

      const { data, total } = await PaymentsService.getList(req);

      reply.header("x-total-count", total.toString());
      reply.header("Access-Control-Expose-Headers", "x-total-count");
      return reply.send(data);
    } catch (error: any) {
      console.error("Get payment error:", error);

      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Невірні параметри запиту",
          details: error.errors,
        });
      }

      return reply.status(500).send({ error: "Внутрішня помилка сервера" });
    }
  }

  static async getOne(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ): Promise<Payment> {
    const payment = await PaymentsService.getById(parseInt(req.params.id));
    if (!payment) return reply.status(404).send({ error: "Payment not found" });
    return reply.send(payment as Payment);
  }

  static async create(req: FastifyRequest, reply: FastifyReply) {
    const validatedData = createPaymentSchema.parse(req.body);
    const payment = await PaymentsService.create(validatedData);
    return reply.status(201).send(payment);
  }
}
