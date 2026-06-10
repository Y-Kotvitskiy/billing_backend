// backend/src/services/clients.service.ts
import DbService from "./db.service.js";
import bcrypt from "bcrypt";

export class ClientsService {
  static async getAll() {
    return DbService.queryRows(`
      SELECT id, name, phone, is_active, created_at, updated_at 
      FROM clients 
      ORDER BY name
    `);
  }

  static async getById(id: number) {
    return DbService.queryOne(
      `
      SELECT id, name, phone, is_active, created_at, updated_at 
      FROM clients 
      WHERE id = ?
    `,
      [id],
    );
  }

  static async getByPhone(phone: string) {
    return DbService.queryOne(
      `
      SELECT * FROM clients WHERE phone = ?
    `,
      [phone],
    );
  }

  static async create(data: { name: string; phone: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await DbService.execute(
      "INSERT INTO clients (name, phone, password) VALUES (?, ?, ?)",
      [data.name, data.phone, hashedPassword],
    );

    return { id: (result as any).insertId, ...data };
  }

  static async update(
    id: number,
    data: { name?: string; phone?: string; is_active?: boolean },
  ) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.phone) {
      fields.push("phone = ?");
      values.push(data.phone);
    }
    if (data.is_active !== undefined) {
      fields.push("is_active = ?");
      values.push(data.is_active);
    }

    if (fields.length === 0) throw new Error("Нет данных для обновления");

    values.push(id);

    await DbService.execute(
      `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    return this.getById(id);
  }

  static async delete(id: number) {
    await DbService.execute("DELETE FROM clients WHERE id = ?", [id]);
    return { success: true, id };
  }
}
