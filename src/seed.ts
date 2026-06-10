// backend/src/seed.ts
import { SeedService } from "./services/seed.service.js";

SeedService.run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("💥 Критическая ошибка сида:", err);
    process.exit(1);
  });
