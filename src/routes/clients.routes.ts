// backend/src/routes/clients.routes.ts
import { FastifyInstance } from "fastify";
import { ClientsController } from "../controllers/clients.controller.js";
import { hasRole } from "../middleware/roles.middleware.js";
import { clientIdSchema, ClientIdParams } from "../models/client.model.js";

export async function clientsRoutes(fastify: FastifyInstance) {
  // ==================== Клиентские маршруты ====================

  // Клиент видит только свой профиль
  fastify.get(
    "/clients/me",
    {
      preHandler: [fastify.authenticate, hasRole("client")],
    },
    ClientsController.getMyProfile,
  );

  // ==================== Админские и ERP маршруты ====================

  // Админ видит всех клиентов
  fastify.get(
    "/clients",
    {
      preHandler: [fastify.authenticate, hasRole("admin")],
    },
    ClientsController.getAll,
  );

  // Создание клиента (admin + erp)
  fastify.post(
    "/clients",
    {
      preHandler: [fastify.authenticate, hasRole(["admin", "erp"])],
    },
    ClientsController.create,
  );

  // Получение одного клиента (admin + erp)
  fastify.get<{ Params: ClientIdParams }>(
    "/clients/:id",
    {
      schema: {
        params: clientIdSchema,
      },
      preHandler: [fastify.authenticate, hasRole(["admin", "erp"])],
    },
    ClientsController.getById as any,
  );

  // Обновление клиента (admin + erp)
  fastify.put<{ Params: ClientIdParams }>(
    "/clients/:id",
    {
      schema: {
        params: clientIdSchema,
      },
      preHandler: [fastify.authenticate, hasRole(["admin", "erp"])],
    },
    ClientsController.update,
  );

  // Удаление клиента (только admin)
  fastify.delete<{ Params: ClientIdParams }>(
    "/clients/:id",
    {
      schema: {
        params: clientIdSchema,
      },
      preHandler: [fastify.authenticate, hasRole("admin")],
    },
    ClientsController.delete,
  );
}
