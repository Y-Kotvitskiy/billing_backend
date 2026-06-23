import { FastifyRequest } from "fastify";
import DbService from "./db.service.js";
import { ResultSetHeader } from "mysql2";
import {
  CreatePaymentInput,
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

/** SQL queries */
const SQL = {
  INSERT_PAYMENT:
    "INSERT INTO payments (contract_id, client_id, period, transaction_id, amount) VALUES (?, ?, ?, ?, ?)",
  UPDATE_CONTRACT_BALANCE:
    "UPDATE contracts SET balance = balance - ?, paid = paid + ? WHERE id = ?",
  SELECT_PAYMENT_WITH_CONTRACT:
    "SELECT p.*, c.contract_number FROM payments p LEFT JOIN contracts c ON p.contract_id = c.id WHERE p.id = ?",
  SELECT_PAYMENTS_WITH_CONTRACT:
    "p.*, c.contract_number",
  TABLE_PAYMENTS_CONTRACT:
    "payments p LEFT JOIN contracts c ON p.contract_id = c.id",
} as const;

export class PaymentsService {
  /**
   * Create a new payment and update contract balance
   * Uses database transaction to ensure data consistency
   */
  static async create(data: CreatePaymentInput): Promise<Payment> {
    await DbService.execute("START TRANSACTION");
    try {
      const res = (await DbService.execute(SQL.INSERT_PAYMENT, [
        data.contract_id,
        data.client_id,
        data.period,
        data.transaction_id,
        data.amount,
      ])) as ResultSetHeader;

      await DbService.execute(SQL.UPDATE_CONTRACT_BALANCE, [
        data.amount,
        data.amount,
        data.contract_id,
      ]);

      await DbService.execute("COMMIT");
      
      // Fetch and return the created payment with all fields
      return this.getById(res.insertId);
    } catch (e) {
      await DbService.execute("ROLLBACK");
      throw e;
    }
  }

  /**
   * Get paginated list of payments with optional filtering and sorting
   */
  static async getList(req: FastifyRequest) {
    let filters = paymentFilterSchema.parse(req.query);

    // Apply enforced client filter (e.g., for /me endpoint)
    const enforcedClientId = (req as any).enforcedClientId;
    if (enforcedClientId) {
      filters = { ...filters, client_id: enforcedClientId };
    }

    const parsed = paymentQuerySchema.parse(req.query);
    const { limit, offset } = buildPagination(parsed._page, parsed._limit);

    // Build sort string with proper table alias
    const tableAlias = parsed.sort.field === "contract_number" ? "c" : "p";
    const sortStr = `${tableAlias}.${buildSort(parsed.sort)}`;

    // Define filter handlers for each field
    const customHandlers = {
      client_id: (v: number) => ({ condition: "p.client_id = ?", param: v }),
      contract_id: (v: number) => ({ condition: "p.contract_id = ?", param: v }),
      period: (v: string) => ({ condition: "p.period = ?", param: v }),
      q: (v: string) => ({
        condition: "c.contract_number LIKE ?",
        param: `%${v}%`,
      }),
    };

    const { whereClause, params } = buildWhereClause(filters, customHandlers);

    return getListBase<Payment>({
      select: SQL.SELECT_PAYMENTS_WITH_CONTRACT,
      tableName: SQL.TABLE_PAYMENTS_CONTRACT,
      whereClause,
      params,
      sortStr,
      limit,
      offset,
    });
  }

  /**
   * Get a single payment by ID with contract details
   */
  static async getById(id: number): Promise<Payment> {
    const row = await DbService.queryOne(
      SQL.SELECT_PAYMENT_WITH_CONTRACT,
      [id],
    );
    return row;
  }
}
