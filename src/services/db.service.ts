// backend/src/services/db.service.ts
import mysql, {
  RowDataPacket,
  ResultSetHeader,
  FieldPacket,
} from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

type QueryResult<T = any> = T[] | ResultSetHeader;

class DbService {
  private static instance: mysql.Pool | null = null;

  static getPool(): mysql.Pool {
    if (!DbService.instance) {
      DbService.instance = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || "debt_app",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: "+03:00",
        charset: "utf8mb4",
      });

      console.log("✅ MySQL Pool успешно создан");
    }
    return DbService.instance;
  }

  /**
   * Универсальный запрос
   */
  static async query<T = any>(
    sql: string,
    params?: any[],
  ): Promise<[QueryResult<T>, FieldPacket[]]> {
    const pool = this.getPool();
    try {
      const result = await pool.execute(sql, params);
      return result as [QueryResult<T>, FieldPacket[]];
    } catch (error) {
      console.error("❌ DB Query Error:", error);
      throw error;
    }
  }

  /**
   * Запрос, который возвращает массив строк (SELECT)
   */
  static async queryRows<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.query<T>(sql, params);
    return rows as T[];
  }

  /**
   * Запрос, который возвращает одну строку (SELECT ... LIMIT 1)
   */
  static async queryOne<T = any>(
    sql: string,
    params?: any[],
  ): Promise<T | null> {
    const rows = await this.queryRows<T>(sql, params);
    return rows[0] || null;
  }

  /**
   * Выполнить INSERT / UPDATE / DELETE и вернуть информацию о результате
   */
  static async execute<T = ResultSetHeader>(
    sql: string,
    params?: any[],
  ): Promise<T> {
    const [result] = await this.query(sql, params);
    return result as T;
  }

  static async close(): Promise<void> {
    if (DbService.instance) {
      await DbService.instance.end();
      DbService.instance = null;
      console.log("🛑 MySQL Pool закрыт");
    }
  }
}

export default DbService;
