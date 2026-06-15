// backend/src/middleware/roles.middleware.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { UserRole } from "../models/auth.model.js";

export const hasRole = (allowedRoles: UserRole | UserRole[]) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;

    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        error: "Доступ заборонено",
        message: `Ця операція доступна тільки для ролей: ${roles.join(", ")}`,
      });
    }
  };
};
