import { FastifyInstance } from "fastify";
import { ContractsController } from "../controllers/contracts.controller.js";
import { hasRole } from "../middleware/roles.middleware.js";
import {
  Contract,
  contractListResponseSchema,
  contractResponseSchema,
} from "../models/contracts.model.js";

export type ContractListResponse = {
  data: Contract[];
  total: number;
};

export async function contractsRoutes(fastify: FastifyInstance) {
  // Получить список договоров клиента для админа (с пагинацией для Refine)
  fastify.get<{
    Querystring: Record<string, any>; // або створити окремий тип
    Reply: ContractListResponse;
  }>(
    "/contracts",
    {
      preHandler: [fastify.authenticate, hasRole(["admin"])],
      schema: {
        response: {
          200: contractListResponseSchema,
        },
      },
    },
    ContractsController.getList,
  );

  // Получить список своих договоров (с пагинацией для Refine)
  fastify.get<{
    Querystring: Record<string, any>; // або створити окремий тип
    Reply: ContractListResponse;
  }>(
    "/contracts/me",
    {
      preHandler: [fastify.authenticate, hasRole(["client"])],
      schema: {
        response: {
          200: contractListResponseSchema,
        },
      },
    },
    ContractsController.getMyList,
  );

  // Получить один конкретный договор
  fastify.get(
    "/contracts/me/:id",
    {
      preHandler: [fastify.authenticate, hasRole(["client"])],
    },
    ContractsController.getMyOne as any,
  );

  // Получить один конкретный договор
  fastify.get<{
    Params: { id: string };
    Reply: Contract;
  }>(
    "/contracts/:id",
    {
      preHandler: [fastify.authenticate, hasRole(["admin"])],
    },
    ContractsController.getOne,
  );
}
