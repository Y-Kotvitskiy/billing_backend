// backend/src/routes/auth.routes.ts
import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller.js";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/auth/login", AuthController.login);
  fastify.post("/auth/refresh", AuthController.refresh);
}
