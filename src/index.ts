// backend/src/index.ts
import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import dotenv from "dotenv";
import DbService from "./services/db.service.js";
import { clientsRoutes } from "./routes/clients.routes.js";

dotenv.config();

const server = fastify({
  logger: true,
});

// Регистрируем плагины
await server.register(cors, {
  origin: true,
  credentials: true,
});

await server.register(helmet);

// Health check с проверкой БД
server.get("/health", async () => {
  try {
    await DbService.query("SELECT 1 as alive");
    return {
      status: "ok",
      message: "Backend is running 🚀",
      database: "connected ✅",
    };
  } catch (err) {
    return {
      status: "error",
      message: "Backend is running, but DB connection failed",
      database: "disconnected ❌",
    };
  }
});

await server.register(clientsRoutes, { prefix: "/api/v1" });

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await server.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await DbService.close();
  process.exit(0);
});
