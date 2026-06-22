import { FastifyRequest } from "fastify";
import DbService from "./db.service.js";
import { ResultSetHeader } from "mysql2";
import {
  Payment,
  paymentFilterSchema,
  paymentQuerySchema,
} from "../models/payments.model.js";
import {
  buildPagination,
  buildSort,
  buildWhereClause,
  getListBase,
} from "./crud-helpers.js";

export class PaymentsService {
  static async create(data: any) {
    await DbService.execute("START TRANSACTION");
    try {
      const res = (await DbService.execute(
        "INSERT INTO payments (contract_id, client_id, period, transaction_id, amount) VALUES (?, ?, ?, ?, ?)",
        [
          data.contract_id,
          data.client_id,
          data.period,
          data.transaction_id,
          data.amount,
        ],
      )) as ResultSetHeader;

      await DbService.execute(
        "UPDATE contracts SET balance = balance - ?, paid = paid + ? WHERE id = ?",
        [data.amount, data.amount, data.contract_id],
      );

      await DbService.execute("COMMIT");
      return { id: res.insertId, ...data };
    } catch (e) {
      await DbService.execute("ROLLBACK");
      throw e;
    }
  }

  // static async getList(
  //   filter?: { field: "client_id" | "contract_id"; value: number },
  //   params: any = {},
  // ) {
  //   const {
  //     _page = 1,
  //     _limit = 20,
  //     _sort = "p.created_at",
  //     _order = "DESC",
  //   } = params;

  //   const limit = Number(_limit);
  //   const offset = (Number(_page) - 1) * limit;

  //   // Базовая часть SQL
  //   let whereClause = "";
  //   let queryParams: any[] = [];

  //   // Если фильтр передан, добавляем условия
  //   if (filter?.field && filter?.value) {
  //     whereClause = `WHERE p.${filter.field} = ?`;
  //     queryParams = [filter.value];
  //   }

  //   const allowedSort = ["p.created_at", "p.amount", "c.contract_number"];
  //   const sortField = allowedSort.includes(_sort) ? _sort : "p.created_at";
  //   const order = _order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  //   const sql = `
  //   SELECT p.*, c.contract_number
  //   FROM payments p
  //   LEFT JOIN contracts c ON p.contract_id = c.id
  //   ${whereClause}
  //     ORDER BY ${sortField} ${order}
  //     LIMIT ? OFFSET ?
  //   `;

  //   const data = await DbService.queryRows(sql, [
  //     ...queryParams,
  //     String(limit),
  //     String(offset),
  //   ]);

  //   const countSql = `SELECT COUNT(*) as total FROM payments p ${whereClause}`;
  //   const countRes = await DbService.queryRows(countSql, queryParams);

  //   return { data, total: (countRes[0] as any).total };
  // }

  static async getList(req: FastifyRequest) {
    let filters = paymentFilterSchema.parse(req.query);

    // === Enforced filters (зокрема для /me) ===
    const enforcedClientId = (req as any).enforcedClientId;
    if (enforcedClientId) {
      filters = { ...filters, client_id: enforcedClientId };
    }

    const parsed = paymentQuerySchema.parse(req.query);

    const { limit, offset } = buildPagination(parsed._page, parsed._limit);
    const sortStr =
      (parsed.sort.field === "contract_number" ? "c." : "p.") +
      buildSort(parsed.sort);

    const customHandlers = {
      client_id: (v: number) => ({ condition: "p.client_id = ?", param: v }),
      contract_id: (v: number) => ({
        condition: "p.contract_id = ?",
        param: v,
      }),
      period: (v: string) => ({ condition: "p.period = ?", param: v }),
      q: (v: number) => ({
        condition: "(c.contract_number LIKE ? )",
        param: `%${v}%`,
      }),
    };

    const { whereClause, params } = buildWhereClause(filters, customHandlers);

    return getListBase({
      select: "p.*, c.contract_number",
      tableName: "payments p LEFT JOIN contracts c ON p.contract_id = c.id",
      whereClause,
      params,
      sortStr,
      limit,
      offset,
    });
  }

  static async getById(id: number): Promise<Payment> {
    const row = await DbService.queryOne(
      "SELECT p.*,c.contract_number FROM payments p left join contracts c on p.contract_id=c.id WHERE p.id = ?",
      [id],
    );
    return row;
  }
}
