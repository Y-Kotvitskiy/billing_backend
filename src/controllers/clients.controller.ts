// backend/src/controllers/clients.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { ClientsService } from "../services/clients.service.js";
import {
  createClientSchema,
  updateClientSchema,
  ClientIdParams,
} from "../models/client.model.js";

export class ClientsController {
  static async getMyProfile(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user;

    const client = await ClientsService.getById(user.id);
    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    return reply.send(client);
  }

  static async getAll(_req: FastifyRequest, reply: FastifyReply) {
    const clients = await ClientsService.getAll();
    return reply.send(clients);
  }

  static async getById(
    req: FastifyRequest<{ Params: ClientIdParams }>,
    reply: FastifyReply,
  ) {
    const id = req.params.id;

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
    req: FastifyRequest<{ Params: ClientIdParams }>,
    reply: FastifyReply,
  ) {
    try {
      const id = req.params.id;

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
    req: FastifyRequest<{ Params: ClientIdParams }>,
    reply: FastifyReply,
  ) {
    const id = req.params.id;

    await ClientsService.delete(id);
    return reply.send({ message: "Client deleted successfully" });
  }
}
