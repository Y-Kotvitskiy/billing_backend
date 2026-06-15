// В auth.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { AuthPayload } from "../models/auth.model.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: AuthPayload;
  }
}

export const authPlugin = fp(async (fastify) => {
  await fastify.register(jwt, {
    secret:
      process.env.JWT_SECRET || "your_super_secret_key_change_in_production",
    sign: { expiresIn: "7d" },
  });

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: "Неавторизований доступ" });
        throw err;
      }
    },
  );
});
