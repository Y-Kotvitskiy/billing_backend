// backend/src/routes/clients.routes.ts
import { FastifyInstance } from "fastify";
import { ClientsController } from "../controllers/clients.controller.js";

export async function clientsRoutes(fastify: FastifyInstance) {
  fastify.get("/clients", ClientsController.getAll);
  fastify.get("/clients/:id", ClientsController.getById);
  fastify.post("/clients", ClientsController.create);
  fastify.put("/clients/:id", ClientsController.update);
  fastify.delete("/clients/:id", ClientsController.delete);
}
