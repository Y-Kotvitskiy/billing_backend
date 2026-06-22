import strict from "assert/strict";
import DbService from "./db.service";

// crud-helpers.ts
export function buildPagination(_page = 1, _limit = 20) {
  const limit = Math.min(_limit, 200);
  const offset = (_page - 1) * limit;
  return { limit, offset };
}

export function buildSort(sort: { field: string; order: "asc" | "desc" }) {
  const field = sort.field;
  const order = sort.order;

  // Якщо треба спеціальне сортування для певних полів — можна передати мапу
  return `${field} ${order}`;
}

export function buildWhereClause(
  filters: Record<string, string | number>,
  customHandlers: Record<
    string,
    (value: any) => { condition: string; param: any } | null
  >,
) {
  const whereConditions: string[] = [];
  const params: any[] = [];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    const handler = customHandlers[key];
    if (handler) {
      const result = handler(value);
      if (result) {
        whereConditions.push(result.condition);
        params.push(result.param);
      }
    }
  });

  const whereClause = whereConditions.length
    ? "WHERE " + whereConditions.join(" AND ")
    : "";

  return { whereClause, params };
}

export async function getListBase({
  select = "*",
  tableName,
  whereClause,
  params,
  sortStr,
  limit,
  offset,
}: {
  select?: string;
  tableName: string;
  whereClause: string;
  params: any[];
  sortStr: string;
  limit: number;
  offset: number;
}) {
  const sql = `
    SELECT ${select} FROM ${tableName}
    ${whereClause}
    ORDER BY ${sortStr}
    LIMIT ? OFFSET ?
  `;

  const data = await DbService.queryRows(sql, [
    ...params,
    String(limit),
    String(offset),
  ]);

  const countSql = `SELECT COUNT(*) as total FROM ${tableName} ${whereClause}`;
  const totalResult = await DbService.queryOne(countSql, params);

  return {
    data,
    total: Number(totalResult?.total || 0),
  };
}

export async function getOneBase({
  select = "*",
  tableName,
  whereClause,
  params,
}: {
  select?: string;
  tableName: string;
  whereClause: string;
  params: any[];
}) {
  const countSql = `SELECT ${select} FROM ${tableName} ${whereClause}`;
  const data = await DbService.queryOne(countSql, params);

  return data;
}
