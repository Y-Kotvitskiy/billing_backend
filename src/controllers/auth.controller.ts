// backend/src/controllers/auth.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/auth.service.js";
import { loginSchema } from "../models/auth.model.js";

export class AuthController {
  static async login(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { phone, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(phone, password);

      // Зберігаємо refresh token в HttpOnly cookie
      reply.setCookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 днів
      });

      return reply.send({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return reply.status(400).send({
          error: "Validation error",
          details: error.errors,
        });
      }

      return reply.status(401).send({
        error: error.message || "Невірний логін або пароль",
      });
    }
  }

  static async refresh(req: FastifyRequest, reply: FastifyReply) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({ error: "Refresh token не знайдено" });
      }

      const result = await AuthService.refresh(refreshToken);

      return reply.send({ accessToken: result.accessToken });
    } catch (error: any) {
      return reply
        .status(401)
        .send({ error: error.message || "Недійсний refresh token" });
    }
  }
}
