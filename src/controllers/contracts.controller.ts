import { FastifyRequest, FastifyReply } from "fastify";
import { ContractsService } from "../services/contracts.service.js";
import { Contract } from "../models/contracts.model.js";

interface ClientContractsParams {
  clientId: string;
}

export class ContractsController {
  static async getMyList(req: FastifyRequest, reply: FastifyReply) {
    const clientId = req.user?.id;

    if (!clientId) {
      return reply.code(401).send({ message: "Не авторизовано" });
    }

    try {
      (req as any).enforcedClientId = clientId;
      const { data, total } = await ContractsService.getList(req);

      reply.header("x-total-count", total);
      reply.header("Access-Control-Expose-Headers", "x-total-count");
      return reply.send(data);
    } catch (error: any) {
      console.error("Get contracts error:", error);

      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Невірні параметри запиту",
          details: error.errors,
        });
      }

      return reply.status(500).send({ error: "Внутрішня помилка сервера" });
    }
  }

  static async getList(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { data, total } = await ContractsService.getList(req);

      reply.header("x-total-count", total);
      reply.header("Access-Control-Expose-Headers", "x-total-count");
      return reply.send(data);
    } catch (error: any) {
      console.error("Get contracts error:", error);

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
  ): Promise<Contract> {
    const contractId = parseInt(req.params.id);
    (req as any).contractId = contractId;

    const contract = await ContractsService.getById(req);
    if (!contract)
      return reply
        .status(404)
        .send({ error: "Contract not found", contractId });
    return reply.send(contract);
  }

  static async getMyOne(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const contractId = parseInt(req.params.id);
    (req as any).contractId = contractId;

    const clientId = req.user?.id;

    if (!clientId) {
      return reply.code(401).send({ message: "Не авторизовано" });
    }

    (req as any).enforcedClientId = clientId;

    const contract = await ContractsService.getById(req);
    if (!contract)
      return reply
        .status(404)
        .send({ error: "Contract not found", contractId });
    return reply.send(contract);
  }
}
