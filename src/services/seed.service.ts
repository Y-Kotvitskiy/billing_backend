// backend/src/services/seed.service.ts
import DbService from "./db.service.js";
import bcrypt from "bcrypt";

export class SeedService {
  static async createTables() {
    try {
      // 1. Таблица клиентов
      await DbService.execute(`
        CREATE TABLE IF NOT EXISTS clients (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          name        VARCHAR(255) NOT NULL,
          phone       VARCHAR(20) UNIQUE NOT NULL,
          password    VARCHAR(255) NOT NULL,
          is_active   BOOLEAN DEFAULT TRUE,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
      `);

      // 2. Таблица сальдо договоров (contracts)
      // Используем period (DATE или VARCHAR 'YYYY-MM') для группировки
      await DbService.execute(`
        CREATE TABLE IF NOT EXISTS contracts (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          client_id       INT NOT NULL,
          period          VARCHAR(7) NOT NULL, -- Формат 'YYYY-MM'
          contract_number VARCHAR(50) NOT NULL,
          charged         DECIMAL(10, 2) DEFAULT 0,
          paid            DECIMAL(10, 2) DEFAULT 0,
          balance         DECIMAL(10, 2) DEFAULT 0,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);

      // 3. Таблица платежей
      await DbService.execute(`
        CREATE TABLE IF NOT EXISTS payments (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          contract_id     INT NOT NULL,
          client_id       INT NOT NULL,
          period          VARCHAR(7) NOT NULL,
          transaction_id  VARCHAR(100) UNIQUE NOT NULL,
          amount          DECIMAL(10, 2) NOT NULL,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);

      console.log("✅ Таблицы успешно созданы");
    } catch (error) {
      console.error("❌ Ошибка создания таблиц:", error);
      throw error;
    }
  }

  static async seedData() {
    // Проверка на наличие данных, чтобы не дублировать
    const check = await DbService.queryRows(
      "SELECT COUNT(*) as count FROM clients",
    );
    if ((check[0] as any).count > 0) return;

    const clients = [
      { name: "Іван Іванов", phone: "380501234567", password: "password123" },
      { name: "Петр Петров", phone: "380502224567", password: "password123" },
      {
        name: "Сидор Сидоров",
        phone: "380503334567",
        password: "password123",
      },
    ];
    for (const { name, phone, password } of clients) {
      // 1. Создаем клиента
      const hashedPassword = await bcrypt.hash(password, 10);
      const clientRes = await DbService.execute(
        "INSERT INTO clients (name, phone, password) VALUES (?, ?, ?)",
        [name, phone, hashedPassword],
      );
      const clientId = (clientRes as any).insertId;

      // 2. Создаем 2 договора на 2 периода (Итого 4 записи)
      const periods = ["2026-05", "2026-06"];
      const contractNumbers = [`№101 - ${name}`, `№102 - ${name}`];

      for (const num of contractNumbers) {
        for (const period of periods) {
          const res = await DbService.execute(
            "INSERT INTO contracts (client_id, period, contract_number, charged, paid, balance) VALUES (?, ?, ?, ?, ?, ?)",
            [clientId, period, num, 1000.0, 0.0, 1000.0],
          );
          const contractId = (res as any).insertId;

          // 3. Создаем 3 оплаты на каждый договор
          for (let i = 1; i <= 3; i++) {
            await DbService.execute(
              "INSERT INTO payments (contract_id, client_id, period, transaction_id, amount) VALUES (?, ?, ?, ?, ?)",
              [
                contractId,
                clientId,
                period,
                `TXN-${num}-${period}-${i}`,
                100.0,
              ],
            );
          }
        }
      }
    }
    console.log("✅ Данные успешно заполнены");
  }

  static async run() {
    await this.createTables();
    await this.seedData();
  }
}

// update contracts c
// join (select contract_id, PERIOD, sum(amount) as amount from payments GROUP BY contract_id, `period`) p on c.id = p.contract_id and c.period = p.period
// set c.charged=1000, c.paid = p.amount, c.balance = 1000 - p.amount;
