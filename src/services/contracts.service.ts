import { FastifyReply, FastifyRequest } from "fastify";
import DbService from "./db.service.js";
import {
  Contract,
  contractFilterSchema,
  contractQuerySchema,
} from "../models/contracts.model.js";
import {
  buildPagination,
  buildSort,
  buildWhereClause,
  getListBase,
} from "./crud-helpers.js";

export class ContractsService {
  static async getList(req: FastifyRequest) {
    let filters = contractFilterSchema.parse(req.query);

    // === Enforced filters (зокрема для /me) ===
    const enforcedClientId = (req as any).enforcedClientId;

    if (enforcedClientId) {
      filters = { ...filters, client_id: enforcedClientId };
    }

    const contractId = (req as any).contractId;

    if (contractId) {
      filters = { ...filters, id: contractId };
    }

    const parsed = contractQuerySchema.parse(req.query);

    const { limit, offset } = buildPagination(parsed._page, parsed._limit);
    const sortStr = buildSort(parsed.sort);

    const customHandlers = {
      id: (v: number) => ({ condition: "id = ?", param: v }),
      client_id: (v: number) => ({ condition: "client_id = ?", param: v }),
      period: (v: string) => ({ condition: "period = ?", param: v }),
      balance_gte: (v: number) => ({ condition: "balance >= ?", param: v }),
      balance_lte: (v: number) => ({ condition: "balance <= ?", param: v }),
      q: (v: number) => ({
        condition: "(contract_number LIKE ? )",
        param: `%${v}%`,
      }),
    };

    const { whereClause, params } = buildWhereClause(filters, customHandlers);

    return getListBase({
      tableName: "contracts",
      whereClause,
      params,
      sortStr,
      limit,
      offset,
    });
  }

  static async getById(
    contractId: number,
    clientId?: number,
  ): Promise<Contract> {
    const sql = clientId
      ? "SELECT * FROM contracts  WHERE id = ? and client_id = ?"
      : "SELECT * FROM contracts  WHERE id = ?";
    const params = clientId ? [contractId, clientId] : [contractId];
    const row = await DbService.queryOne(sql, params);
    return row;
  }
}
