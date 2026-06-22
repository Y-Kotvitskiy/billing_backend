// backend/src/models/auth.model.ts
import { z } from "zod";

export type UserRole = "client" | "admin" | "erp";

export const loginSchema = z.object({
  phone: z.string().min(10, "Некоректний номер телефону"),
  password: z.string().min(6, "Невірний пароль"),
});

export interface AuthPayload {
  id: number;
  phone: string;
  name: string;
  role: UserRole;
  is_active: boolean;
}

// Для ответа после логина
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    name: string;
    phone: string;
    role: UserRole;
  };
}

export type LoginInput = z.infer<typeof loginSchema>;

// Тип для клиента из базы
export interface ClientUser {
  id: number;
  name: string;
  phone: string;
  password: string;
  role: "client";
  is_active: boolean;
}

// Тип для служебных пользователей (admin, erp)
export interface ServiceUser {
  id: number;
  name: string;
  phone: string;
  role: "admin" | "erp" | "client";
  is_active: boolean;
  // password не нужен, т.к. проверяется раньше
}

// Объединённый тип
export type LoginUser = ClientUser | ServiceUser;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
