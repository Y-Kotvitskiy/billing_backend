// backend/src/services/seed.service.ts
import DbService from "./db.service.js";
import bcrypt from "bcrypt";

export class SeedService {
  static async createClientsTable() {
    try {
      await DbService.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          name        VARCHAR(255) NOT NULL,
          phone       VARCHAR(20)  UNIQUE NOT NULL,
          password    VARCHAR(255) NOT NULL,
          is_active   BOOLEAN DEFAULT TRUE,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      console.log("✅ Таблица `clients` успешно создана или уже существует");
    } catch (error) {
      console.error("❌ Ошибка при создании таблицы clients:", error);
      throw error;
    }
  }

  static async seedClients() {
    try {
      // Проверяем, есть ли уже клиенты
      const existing = await DbService.queryRows(
        "SELECT COUNT(*) as count FROM clients",
      );
      const count = (existing[0] as any).count;

      if (count > 0) {
        console.log(
          `⚠️ В таблице clients уже ${count} записей. Заполнение пропущено.`,
        );
        return;
      }

      const testClients = [
        {
          name: "Іван Іванов",
          phone: "+380501234567",
          password: "password123",
        },
        {
          name: "Олена Петренко",
          phone: "+380671234567",
          password: "qwerty456",
        },
        {
          name: "Сергій Сидоров",
          phone: "+380931234567",
          password: "client789",
        },
        {
          name: "Анна Коваленко",
          phone: "+380991234567",
          password: "anna2025",
        },
      ];

      let inserted = 0;

      for (const client of testClients) {
        const hashedPassword = await bcrypt.hash(client.password, 10);

        await DbService.execute(
          "INSERT INTO clients (name, phone, password) VALUES (?, ?, ?)",
          [client.name, client.phone, hashedPassword],
        );
        inserted++;
      }

      console.log(`✅ Успешно добавлено ${inserted} тестовых клиентов`);
    } catch (error) {
      console.error("❌ Ошибка при заполнении таблицы clients:", error);
      throw error;
    }
  }

  static async run() {
    console.log("🚀 Запуск сида базы данных...");
    await this.createClientsTable();
    await this.seedClients();
    console.log("🎉 Сидинг завершён успешно!");
  }
}
