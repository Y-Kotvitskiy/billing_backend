// backend/src/services/auth.service.ts
import DbService from "./db.service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import {
  AuthPayload,
  AuthResponse,
  ClientUser,
  LoginUser,
} from "../models/auth.model.js";

const ACCESS_TOKEN_EXPIRES = "15m"; // короткий
const REFRESH_TOKEN_EXPIRES = "7d"; // довгий

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in .env");
}

export class AuthService {
  static async login(phone: string, password: string): Promise<AuthResponse> {
    let user: LoginUser | null = null;

    // === ADMIN ===
    if (phone === process.env.ADMIN_PHONE) {
      if (password !== process.env.ADMIN_PASSWORD) {
        throw new Error("Невірний логін або пароль");
      }

      user = {
        id: 9999,
        name: "Administrator",
        phone: phone,
        role: "admin",
        is_active: true,
      };

      // user = {
      //   id: 2,
      //   name: "Peter",
      //   phone: "123",
      //   role: "client",
      //   is_active: true,
      // };

      // user = {
      //   id: 2,
      //   name: "Петр",
      //   phone: "123",
      //   role: "client",
      //   is_active: true,
      // };
    }
    // === ERP ===
    else if (phone === process.env.ERP_PHONE) {
      if (password !== process.env.ERP_PASSWORD) {
        throw new Error("Невірний логін або пароль");
      }

      user = {
        id: 8888,
        name: "ERP Integration",
        phone: phone,
        role: "erp",
        is_active: true,
      };
    }
    // === CLIENT ===
    else {
      const client = await DbService.queryOne<ClientUser>(
        `
        SELECT id, name, phone, password, is_active
        FROM clients
        WHERE phone = ?
      `,
        [phone],
      );

      if (!client) throw new Error("Невірний номер телефону або пароль");
      if (!client.is_active) throw new Error("Акаунт деактивовано");

      const isPasswordValid = await bcrypt.compare(password, client.password);
      if (!isPasswordValid)
        throw new Error("Невірний номер телефону або пароль");

      user = { ...client, role: "client" };
    }

    if (!user) throw new Error("Невірний логін або пароль");

    // Payload для JWT
    const payload: AuthPayload = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES,
    });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  static async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: number };

      // Отримуємо актуальні дані користувача
      const user = await DbService.queryOne(
        `
        SELECT id, name, phone, role, is_active 
        FROM clients WHERE id = ?
      `,
        [decoded.id],
      );

      if (!user || !user.is_active)
        throw new Error("Користувач не знайдений або деактивований");

      const payload: AuthPayload = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES,
      });

      return { accessToken };
    } catch (err) {
      throw new Error("Недійсний refresh token");
    }
  }
}
