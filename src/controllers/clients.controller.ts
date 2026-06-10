// backend/src/controllers/clients.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { ClientsService } from "../services/clients.service.js";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(2, "Имя должно быть не менее 2 символов"),
  phone: z.string().min(10, "Некорректный номер телефона"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

const updateClientSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  is_active: z.boolean().optional(),
});

export class ClientsController {
  static async getAll(_req: FastifyRequest, reply: FastifyReply) {
    const clients = await ClientsService.getAll();
    return reply.send(clients);
  }

  static async getById(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return reply.status(400).send({ error: "Invalid ID" });

    const client = await ClientsService.getById(id);
    if (!client) return reply.status(404).send({ error: "Client not found" });

    return reply.send(client);
  }

  static async create(req: FastifyRequest, reply: FastifyReply) {
    try {
      const validatedData = createClientSchema.parse(req.body);
      const client = await ClientsService.create(validatedData);

      return reply.status(201).send(client);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Validation error",
          details: error.errors,
        });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  static async update(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return reply.status(400).send({ error: "Invalid ID" });

      const validatedData = updateClientSchema.parse(req.body);
      const updated = await ClientsService.update(id, validatedData);

      if (!updated)
        return reply.status(404).send({ error: "Client not found" });

      return reply.send(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Validation error",
          details: error.errors,
        });
      }
      return reply.status(500).send({ error: "Internal server error" });
    }
  }

  static async delete(
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return reply.status(400).send({ error: "Invalid ID" });

    await ClientsService.delete(id);
    return reply.send({ message: "Client deleted successfully" });
  }
}
